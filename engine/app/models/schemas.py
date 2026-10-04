from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RawLogEntry(BaseModel):
    event_id: str
    timestamp: str
    log_source: str  # e.g., "auth_syslog", "firewall", "edr", "cloudtrail", "dns"
    raw_text: str


class NormalizedLog(BaseModel):
    event_id: str
    timestamp: str
    log_source: str
    event_type: str
    user: Optional[str] = None
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    hostname: Optional[str] = None
    action: str  # "ALLOW", "DENY", "SUCCESS", "FAILURE", "EXECUTE"
    protocol: Optional[str] = None
    port: Optional[int] = None
    process: Optional[str] = None
    raw_text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DetectedAlert(BaseModel):
    alert_id: str
    rule_id: str
    rule_name: str
    mitre_technique: str
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    timestamp: str
    entities: List[str]  # e.g., ["198.51.100.42", "user:sysadmin", "host:prod-db-01"]
    evidence_event_ids: List[str]
    description: str


class NarrativeClaim(BaseModel):
    claim_id: str
    sentence: str
    evidence_event_ids: List[str]
    is_verified: bool = True
    mitre_stage: str  # e.g., "Initial Access", "Privilege Escalation", "Lateral Movement", "Exfiltration"


class AttackReplayStep(BaseModel):
    step_number: int
    title: str
    mitre_technique: str
    timestamp: str
    source_entity: str
    target_entity: str
    action_summary: str
    evidence_event_ids: List[str]


class DecoySummary(BaseModel):
    event_id: str
    timestamp: str
    log_source: str
    description: str
    reason_cleared: str


class Scorecard(BaseModel):
    total_raw_events: int
    normalized_events: int
    alerts_detected: int
    incidents_correlated: int
    decoys_cleared: int
    noise_reduction_percentage: float
    citation_accuracy_percentage: float
    estimated_triage_minutes_saved: float


class CorrelatedIncident(BaseModel):
    incident_id: str
    title: str
    severity: str
    confidence: float
    start_time: str
    end_time: str
    attacker_ip: str
    compromised_hosts: List[str]
    compromised_users: List[str]
    narrative: List[NarrativeClaim]
    replay_steps: List[AttackReplayStep]
    alert_ids: List[str]
    evidence_event_ids: List[str]
    cleared_decoys: List[DecoySummary]
    scorecard: Scorecard


class AnalysisRequest(BaseModel):
    dataset_name: Optional[str] = "benchmark_52k"
    raw_logs: Optional[List[RawLogEntry]] = None
