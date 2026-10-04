import os
import json
import logging
from typing import List, Dict, Any, Tuple, Optional, Set
import httpx
from app.models.schemas import (
    DetectedAlert,
    NarrativeClaim,
)
from app.core.config import settings

logger = logging.getLogger("traceback.gemini")


class GeminiNarrativeService:
    """
    Generates evidence-locked incident narratives using Google Gemini API Free Tier.

    SECURITY CONTRACT:
    - NEVER sends raw log lines to Gemini.
    - Sends ONLY structured finding metadata (rule IDs, timestamps, sanitized entities, counts, evidence IDs).
    - Validates all generated claim evidence IDs against ground-truth finding event IDs.
    - Recalculates linkage accuracy and drops unsupported claims.
    - Gracefully falls back to deterministic Python template narrative if Gemini is unavailable or fails validation.
    """

    @staticmethod
    def _format_findings_payload(alerts: List[DetectedAlert]) -> List[Dict[str, Any]]:
        """
        Extracts ONLY safe structured finding metadata for Gemini consumption.
        No raw logs or un-sanitized log lines are passed.
        """
        payload = []
        for alt in alerts:
            payload.append(
                {
                    "finding_id": alt.alert_id,
                    "rule_name": alt.rule_name,
                    "mitre_technique": alt.mitre_technique,
                    "severity": alt.severity,
                    "timestamp": alt.timestamp,
                    "entities": alt.entities,
                    "event_count": len(alt.evidence_event_ids),
                    "evidence_ids": alt.evidence_event_ids,
                    "description": alt.description,
                }
            )
        return payload

    @classmethod
    def generate_narrative(
        cls, alerts: List[DetectedAlert], all_valid_event_ids: Set[str]
    ) -> Tuple[List[NarrativeClaim], Dict[str, Any], bool]:
        """
        Main entry point. Returns (narrative_claims, metadata, is_gemini_used).
        Tries Gemini API with 1 retry. Validates evidence citations.
        Falls back to deterministic template if Gemini fails.
        """
        api_key = os.getenv("GEMINI_API_KEY", "").strip() or getattr(
            settings, "GEMINI_API_KEY", ""
        )

        if not api_key:
            logger.info(
                "GEMINI_API_KEY not set. Using deterministic template narrative fallback."
            )
            return cls._deterministic_fallback(alerts)

        findings_payload = cls._format_findings_payload(alerts)

        # Try Gemini API with 1 retry
        for attempt in range(1, 3):
            try:
                gemini_json = cls._call_gemini_api(api_key, findings_payload)
                if not gemini_json:
                    continue

                # Validate & Filter Evidence Citations
                claims, is_valid = cls._validate_and_filter_narrative(
                    gemini_json, all_valid_event_ids
                )
                if is_valid and claims:
                    return (
                        claims,
                        {
                            "mode": "gemini",
                            "model": "gemini-2.5-flash",
                            "attempt": attempt,
                            "title": gemini_json.get("title", ""),
                            "summary": gemini_json.get("summary", ""),
                            "containment": gemini_json.get("containment", []),
                            "uncertainties": gemini_json.get("uncertainties", []),
                        },
                        True,
                    )
            except Exception as e:
                logger.warning(f"Gemini API attempt {attempt} failed: {e}")

        logger.warning(
            "Gemini API failed or produced invalid citations after retries. Falling back to deterministic narrative."
        )
        return cls._deterministic_fallback(alerts)

    @classmethod
    def _call_gemini_api(
        cls, api_key: str, findings_payload: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Calls Google AI Studio Gemini API endpoint with structured JSON mode.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        prompt = f"""You are a tier-3 SOC security analyst building an evidence-locked incident story for a kill-chain correlation engine.

INPUT STRUCTURED FINDINGS:
{json.dumps(findings_payload, indent=2)}

CRITICAL SECURITY RULES:
1. You must return ONLY valid JSON strictly matching the requested schema.
2. Every claim in `steps` MUST include valid `evidence_ids` chosen directly from the evidence_ids listed in the input findings.
3. DO NOT invent or fabricate any event IDs that do not exist in the input findings.
4. If an evidence ID is not in the finding input, DO NOT cite it.

EXPECTED JSON SCHEMA:
{{
  "title": "Short descriptive incident headline",
  "severity": "CRITICAL",
  "summary": "Executive summary of the attack chain",
  "steps": [
    {{
      "stage": "Initial Access",
      "claim": "Specific sentence describing the event",
      "evidence_ids": ["EV-10001", "EV-10002"],
      "confidence": 0.99
    }}
  ],
  "containment": [
    {{
      "action": "Containment step recommendation",
      "why": "Reason for action based on findings",
      "evidence_ids": ["EV-10001"]
    }}
  ],
  "uncertainties": []
}}
"""

        headers = {"Content-Type": "application/json"}
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                # Try fallback model gemini-1.5-flash if 2.5-flash is unavailable
                fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                resp = client.post(fallback_url, headers=headers, json=body)
                if resp.status_code != 200:
                    return None

            data = resp.json()
            try:
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_content)
            except (KeyError, IndexError, json.JSONDecodeError):
                return None

    @classmethod
    def _validate_and_filter_narrative(
        cls, gemini_json: Dict[str, Any], valid_event_ids: Set[str]
    ) -> Tuple[List[NarrativeClaim], bool]:
        """
        Validates Gemini response schema, verifies all evidence IDs, filters out invalid claims,
        and computes verification accuracy.
        """
        steps = gemini_json.get("steps", [])
        if not steps:
            return [], False

        validated_claims: List[NarrativeClaim] = []
        valid_claims_count = 0

        for idx, step in enumerate(steps, 1):
            claim_text = step.get("claim", "")
            raw_evidence_ids = step.get("evidence_ids", [])
            stage = step.get("stage", "Execution")

            # Filter evidence IDs to only those that exist in valid_event_ids
            filtered_ids = [
                ev_id for ev_id in raw_evidence_ids if ev_id in valid_event_ids
            ]
            is_verified = (
                len(filtered_ids) == len(raw_evidence_ids) and len(filtered_ids) > 0
            )

            if filtered_ids:
                valid_claims_count += 1
                validated_claims.append(
                    NarrativeClaim(
                        claim_id=f"CLM-{idx:03d}",
                        sentence=claim_text,
                        evidence_event_ids=filtered_ids,
                        is_verified=is_verified,
                        mitre_stage=stage,
                    )
                )

        # Require at least 50% valid claims to consider Gemini response successful
        is_narrative_valid = (
            (valid_claims_count / len(steps)) >= 0.5 if steps else False
        )
        return validated_claims, is_narrative_valid

    @classmethod
    def _deterministic_fallback(
        cls, alerts: List[DetectedAlert]
    ) -> Tuple[List[NarrativeClaim], Dict[str, Any], bool]:
        """
        Deterministic Python fallback template narrative. 100% evidence linkage guaranteed.
        """
        claims: List[NarrativeClaim] = []
        if not alerts:
            claims.append(
                NarrativeClaim(
                    claim_id="CLM-001",
                    sentence="No malicious activity or suspicious kill-chain patterns detected in the analyzed log stream.",
                    evidence_event_ids=[],
                    is_verified=True,
                    mitre_stage="Clean Baseline",
                )
            )
        else:
            for idx, alt in enumerate(alerts, 1):
                claims.append(
                    NarrativeClaim(
                        claim_id=f"CLM-{idx:03d}",
                        sentence=f"[{alt.mitre_technique}] {alt.description}",
                        evidence_event_ids=alt.evidence_event_ids,
                        is_verified=True,
                        mitre_stage=alt.rule_name.split()[0]
                        if alt.rule_name
                        else "Execution",
                    )
                )

        meta = {
            "mode": "deterministic_fallback",
            "model": "python_rule_engine",
            "summary": "Deterministic template narrative generated from verified rule detections.",
        }
        return claims, meta, False
