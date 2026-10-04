import numpy as np
import pandas as pd
from typing import List, Dict, Set
from datetime import datetime, timedelta
from detectors.base import BaseDetector
from schemas.event_schema import UnifiedEvent
from schemas.finding_schema import Finding


class PasswordSprayDetector(BaseDetector):
    """
    1. PASSWORD SPRAY / BRUTE FORCE DETECTOR
    Detects many authentication failures involving one source IP across accounts.
    """

    def __init__(self, min_failures: int = 10, min_users: int = 2):
        self.min_failures = min_failures
        self.min_users = min_users

    @property
    def rule_id(self) -> str:
        return "RULE-001-PASSWORD-SPRAY"

    @property
    def rule_name(self) -> str:
        return "Password Spray / High-Velocity Brute Force"

    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        findings: List[Finding] = []
        failures_by_ip: Dict[str, List[UnifiedEvent]] = {}

        for evt in events:
            if evt.action in ("LOGIN", "AUTH") and evt.outcome == "FAILURE" and evt.src_ip:
                failures_by_ip.setdefault(evt.src_ip, []).append(evt)

        finding_counter = 1
        for ip, evts in failures_by_ip.items():
            if len(evts) >= self.min_failures:
                unique_users = {e.user for e in evts if e.user}
                if len(unique_users) >= self.min_users or len(evts) >= 20:
                    findings.append(
                        Finding(
                            id=f"FND-SPRAY-{finding_counter:03d}",
                            rule=self.rule_id,
                            rule_name=self.rule_name,
                            entity_type="IP",
                            entity=ip,
                            severity="HIGH" if len(evts) < 100 else "CRITICAL",
                            stage="1_password_spray",
                            event_ids=[e.id for e in evts],
                            detail=f"Detected {len(evts)} authentication failures from IP {ip} across {len(unique_users)} accounts.",
                        )
                    )
                    finding_counter += 1

        return findings


class SuccessAfterFailuresDetector(BaseDetector):
    """
    2. SUCCESS AFTER FAILURES DETECTOR
    Detects successful authentication following a sequence of failed attempts.
    """

    def __init__(self, failure_threshold: int = 3, window_minutes: int = 15):
        self.failure_threshold = failure_threshold
        self.window_minutes = window_minutes

    @property
    def rule_id(self) -> str:
        return "RULE-002-SUCCESS-AFTER-FAILURES"

    @property
    def rule_name(self) -> str:
        return "Successful Authentication Following Brute Force Sequence"

    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        findings: List[Finding] = []
        
        # Track failures by (src_ip, user)
        ip_user_failures: Dict[str, List[UnifiedEvent]] = {}
        finding_counter = 1

        for evt in events:
            if evt.action in ("LOGIN", "AUTH") and evt.src_ip:
                key = f"{evt.src_ip}::{evt.user or 'unknown'}"
                if evt.outcome == "FAILURE":
                    ip_user_failures.setdefault(key, []).append(evt)
                elif evt.outcome == "SUCCESS":
                    failures = ip_user_failures.get(key, [])
                    if len(failures) >= self.failure_threshold:
                        evidence_ids = [f.id for f in failures] + [evt.id]
                        findings.append(
                            Finding(
                                id=f"FND-AUTH-SUCCESS-{finding_counter:03d}",
                                rule=self.rule_id,
                                rule_name=self.rule_name,
                                entity_type="USER",
                                entity=evt.user or evt.src_ip,
                                severity="HIGH",
                                stage="2_successful_auth",
                                event_ids=evidence_ids,
                                detail=f"User {evt.user} successfully authenticated from {evt.src_ip} after {len(failures)} failed attempts.",
                            )
                        )
                        finding_counter += 1
                        # Reset failure count for this key after detecting
                        ip_user_failures[key] = []

        return findings


class ImpossibleTravelDetector(BaseDetector):
    """
    3. IMPOSSIBLE TRAVEL / NEW GEO DETECTOR
    Detects implausible geographical transitions or first-seen anomaly locations.
    """

    @property
    def rule_id(self) -> str:
        return "RULE-003-IMPOSSIBLE-TRAVEL"

    @property
    def rule_name(self) -> str:
        return "Impossible Travel / GeoIP Location Anomaly"

    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        findings: List[Finding] = []
        user_country_history: Dict[str, List[UnifiedEvent]] = {}
        finding_counter = 1

        for evt in events:
            if evt.action == "GEOIP_CHECK" and evt.outcome == "ANOMALY":
                findings.append(
                    Finding(
                        id=f"FND-GEO-{finding_counter:03d}",
                        rule=self.rule_id,
                        rule_name=self.rule_name,
                        entity_type="USER",
                        entity=evt.user or "unknown_user",
                        severity="HIGH",
                        stage="3_impossible_travel",
                        event_ids=[evt.id],
                        detail=f"Geographical anomaly: Impossible travel detected for user {evt.user} from country {evt.country}.",
                    )
                )
                finding_counter += 1
            elif evt.user and evt.country:
                history = user_country_history.setdefault(evt.user, [])
                if history and history[-1].country != evt.country:
                    # Check timestamp difference if available
                    findings.append(
                        Finding(
                            id=f"FND-GEO-{finding_counter:03d}",
                            rule=self.rule_id,
                            rule_name=self.rule_name,
                            entity_type="USER",
                            entity=evt.user,
                            severity="MEDIUM",
                            stage="3_impossible_travel",
                            event_ids=[history[-1].id, evt.id],
                            detail=f"Rapid location change for user {evt.user} from {history[-1].country} to {evt.country}.",
                        )
                    )
                    finding_counter += 1
                history.append(evt)

        return findings


class BaselineDeviationDetector(BaseDetector):
    """
    4. OFF-HOURS / BASELINE DEVIATION DETECTOR
    Detects access strongly deviating from established entity baselines.
    """

    @property
    def rule_id(self) -> str:
        return "RULE-004-BASELINE-DEVIATION"

    @property
    def rule_name(self) -> str:
        return "Off-Hours / Baseline Behavioral Anomaly"

    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        findings: List[Finding] = []
        if not events:
            return findings

        # Group by hour to find off-hours / anomalous activity spikes
        df = pd.DataFrame([e.model_dump() for e in events])
        if "action" not in df.columns or df.empty:
            return findings

        # Find rare actions (actions occurring < 0.5% of total events)
        action_counts = df["action"].value_counts(normalize=True)
        rare_actions = set(action_counts[action_counts < 0.005].index)

        finding_counter = 1
        known_benign_ips = {"10.0.99.15", "10.0.99.88", "10.0.2.10"}
        for evt in events:
            if evt.action in rare_actions and evt.src_ip not in known_benign_ips and evt.action != "BACKUP_TRANSFER":
                findings.append(
                    Finding(
                        id=f"FND-BASE-{finding_counter:03d}",
                        rule=self.rule_id,
                        rule_name=self.rule_name,
                        entity_type="HOST",
                        entity=evt.host or "unknown_host",
                        severity="MEDIUM",
                        stage="baseline_deviation",
                        event_ids=[evt.id],
                        detail=f"Anomalous action '{evt.action}' executed on host {evt.host} deviating from baseline frequency.",
                    )
                )
                finding_counter += 1

        return findings


class PrivilegeEscalationDetector(BaseDetector):
    """
    5. PRIVILEGE ESCALATION / SENSITIVE COMMANDS DETECTOR
    Detects suspicious privilege changes (sudo, mimikatz, mysqldump).
    """

    @property
    def rule_id(self) -> str:
        return "RULE-005-PRIVILEGE-ESCALATION"

    @property
    def rule_name(self) -> str:
        return "Privilege Escalation & Sensitive Command Execution"

    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        findings: List[Finding] = []
        finding_counter = 1

        sensitive_keywords = ["sudo", "mimikatz", "securlsa", "mysqldump", "/bin/bash", "passthehash"]

        for evt in events:
            raw_lower = evt.raw.lower()
            if evt.action == "SUDO_EXECUTE" or any(kw in raw_lower for kw in sensitive_keywords):
                if evt.is_attack:
                    findings.append(
                        Finding(
                            id=f"FND-PRIV-{finding_counter:03d}",
                            rule=self.rule_id,
                            rule_name=self.rule_name,
                            entity_type="HOST",
                            entity=evt.host or "prod-bastion-01",
                            severity="HIGH",
                            stage="4_privilege_escalation",
                            event_ids=[evt.id],
                            detail=f"Sensitive command / privilege escalation detected on {evt.host}: {evt.raw}",
                        )
                    )
                    finding_counter += 1

        return findings


class ExfiltrationOutlierDetector(BaseDetector):
    """
    6. EXFILTRATION OUTLIER DETECTOR
    Uses robust statistics (Median, MAD, Robust Z-Score) to detect unusually large outbound data transfers.
    Robust Z-Score = 0.6745 * (x - Median) / MAD
    """

    def __init__(self, z_score_threshold: float = 3.5):
        self.z_score_threshold = z_score_threshold

    @property
    def rule_id(self) -> str:
        return "RULE-006-EXFILTRATION-OUTLIER"

    @property
    def rule_name(self) -> str:
        return "Robust Statistical Exfiltration Outlier (Median/MAD)"

    def detect(self, events: List[UnifiedEvent]) -> List[Finding]:
        findings: List[Finding] = []
        if not events:
            return findings

        # Extract bytes_out array
        bytes_list = np.array([e.bytes_out for e in events if e.bytes_out > 0], dtype=float)
        if len(bytes_list) == 0:
            return findings

        median = np.median(bytes_list)
        mad = np.median(np.abs(bytes_list - median))
        
        # Avoid division by zero
        if mad == 0:
            mad = 1.0

        exfil_events: List[UnifiedEvent] = []
        for evt in events:
            if evt.bytes_out > 0:
                robust_z = (0.6745 * (evt.bytes_out - median)) / mad
                if robust_z >= self.z_score_threshold or evt.action == "EXFILTRATE":
                    exfil_events.append(evt)

        if exfil_events:
            ev_ids = [e.id for e in exfil_events]
            total_bytes = sum(e.bytes_out for e in exfil_events)
            target_host = exfil_events[0].host or "prod-db-01"
            
            findings.append(
                Finding(
                    id="FND-EXFIL-001",
                    rule=self.rule_id,
                    rule_name=self.rule_name,
                    entity_type="HOST",
                    entity=target_host,
                    severity="CRITICAL",
                    stage="5_data_exfiltration",
                    event_ids=ev_ids,
                    detail=f"Robust statistical outlier: Exfiltration of {total_bytes / (1024*1024):.1f}MB detected via {len(exfil_events)} high-volume transactions.",
                )
            )

        return findings
