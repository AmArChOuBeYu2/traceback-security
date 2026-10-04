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

logger = logging.getLogger("traceback.narrative")

# ─── Shared prompt builder ────────────────────────────────────────────────────

NARRATIVE_PROMPT_TEMPLATE = """You are a tier-3 SOC security analyst building an evidence-locked incident story for a kill-chain correlation engine.

INPUT STRUCTURED FINDINGS:
{findings_json}

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


class GeminiNarrativeService:
    """
    Generates evidence-locked incident narratives.

    Provider priority:
      1. OpenRouter (if OPENROUTER_API_KEY is set)  — uses any model you configure
      2. Google Gemini (if GEMINI_API_KEY is set)   — gemini-2.5-flash / gemini-1.5-flash
      3. Deterministic Python template fallback      — always works, no API needed

    SECURITY CONTRACT:
    - NEVER sends raw log lines to any LLM.
    - Sends ONLY structured finding metadata (rule IDs, timestamps, sanitized entities, counts, evidence IDs).
    - Validates all generated claim evidence IDs against ground-truth finding event IDs.
    - Recalculates linkage accuracy and drops unsupported claims.
    """

    @staticmethod
    def _format_findings_payload(alerts: List[DetectedAlert]) -> List[Dict[str, Any]]:
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
        Main entry point. Returns (narrative_claims, metadata, is_llm_used).
        Tries OpenRouter -> Gemini -> deterministic fallback.
        """
        findings_payload = cls._format_findings_payload(alerts)
        prompt = NARRATIVE_PROMPT_TEMPLATE.format(
            findings_json=json.dumps(findings_payload, indent=2)
        )

        # ── 1. Try OpenRouter ────────────────────────────────────────────────
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        if openrouter_key:
            for attempt in range(1, 3):
                try:
                    result_json = cls._call_openrouter(openrouter_key, prompt)
                    if result_json:
                        claims, is_valid = cls._validate_and_filter_narrative(
                            result_json, all_valid_event_ids
                        )
                        if is_valid and claims:
                            model = os.getenv(
                                "OPENROUTER_MODEL", "google/gemini-2.0-flash-001"
                            )
                            logger.info(
                                f"OpenRouter narrative success (attempt {attempt}, model={model})"
                            )
                            return (
                                claims,
                                {
                                    "mode": "openrouter",
                                    "model": model,
                                    "attempt": attempt,
                                    "title": result_json.get("title", ""),
                                    "summary": result_json.get("summary", ""),
                                    "containment": result_json.get("containment", []),
                                    "uncertainties": result_json.get("uncertainties", []),
                                },
                                True,
                            )
                except Exception as e:
                    logger.warning(f"OpenRouter attempt {attempt} failed: {e}")
            logger.warning("OpenRouter failed after retries.")

        # ── 2. Try Gemini ────────────────────────────────────────────────────
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip() or getattr(
            settings, "GEMINI_API_KEY", ""
        )
        if gemini_key:
            for attempt in range(1, 3):
                try:
                    result_json = cls._call_gemini_api(gemini_key, findings_payload)
                    if result_json:
                        claims, is_valid = cls._validate_and_filter_narrative(
                            result_json, all_valid_event_ids
                        )
                        if is_valid and claims:
                            logger.info(f"Gemini narrative success (attempt {attempt})")
                            return (
                                claims,
                                {
                                    "mode": "gemini",
                                    "model": "gemini-2.5-flash",
                                    "attempt": attempt,
                                    "title": result_json.get("title", ""),
                                    "summary": result_json.get("summary", ""),
                                    "containment": result_json.get("containment", []),
                                    "uncertainties": result_json.get("uncertainties", []),
                                },
                                True,
                            )
                except Exception as e:
                    logger.warning(f"Gemini attempt {attempt} failed: {e}")
            logger.warning("Gemini failed after retries.")

        # ── 3. Deterministic fallback ────────────────────────────────────────
        logger.info(
            "Using deterministic template narrative (no API key set or all providers failed)."
        )
        return cls._deterministic_fallback(alerts)

    # ─── OpenRouter ───────────────────────────────────────────────────────────

    @classmethod
    def _call_openrouter(
        cls, api_key: str, prompt: str
    ) -> Optional[Dict[str, Any]]:
        """
        Calls OpenRouter via the OpenAI-compatible /chat/completions endpoint.
        Model is configurable via OPENROUTER_MODEL env var.
        Defaults to google/gemini-2.0-flash-001 (fast, cheap, great for JSON tasks).
        """
        model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://traceback.security",
            "X-Title": "TRACEBACK Evidence Engine",
        }
        body = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a cybersecurity analyst. Always respond with valid JSON only, no markdown fences.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                logger.warning(
                    f"OpenRouter HTTP {resp.status_code}: {resp.text[:300]}"
                )
                return None

            data = resp.json()
            try:
                text_content = data["choices"][0]["message"]["content"]
                return json.loads(text_content)
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                logger.warning(f"OpenRouter response parse error: {e}")
                return None

    # ─── Gemini ───────────────────────────────────────────────────────────────

    @classmethod
    def _call_gemini_api(
        cls, api_key: str, findings_payload: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Calls Google AI Studio Gemini API with structured JSON mode."""
        prompt = NARRATIVE_PROMPT_TEMPLATE.format(
            findings_json=json.dumps(findings_payload, indent=2)
        )
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        fallback_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                resp = client.post(fallback_url, headers=headers, json=body)
                if resp.status_code != 200:
                    return None

            data = resp.json()
            try:
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text_content)
            except (KeyError, IndexError, json.JSONDecodeError):
                return None

    # ─── Validation ───────────────────────────────────────────────────────────

    @classmethod
    def _validate_and_filter_narrative(
        cls, result_json: Dict[str, Any], valid_event_ids: Set[str]
    ) -> Tuple[List[NarrativeClaim], bool]:
        """
        Validates LLM response schema, verifies all evidence IDs, filters out invalid claims.
        Requires >= 50% of steps to have valid evidence IDs.
        """
        steps = result_json.get("steps", [])
        if not steps:
            return [], False

        validated_claims: List[NarrativeClaim] = []
        valid_claims_count = 0

        for idx, step in enumerate(steps, 1):
            claim_text = step.get("claim", "")
            raw_evidence_ids = step.get("evidence_ids", [])
            stage = step.get("stage", "Execution")

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

        is_narrative_valid = (
            (valid_claims_count / len(steps)) >= 0.5 if steps else False
        )
        return validated_claims, is_narrative_valid

    # ─── Deterministic fallback ────────────────────────────────────────────────

    @classmethod
    def _deterministic_fallback(
        cls, alerts: List[DetectedAlert]
    ) -> Tuple[List[NarrativeClaim], Dict[str, Any], bool]:
        """
        Deterministic Python fallback template narrative. 100% evidence linkage guaranteed.
        No API key required.
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
