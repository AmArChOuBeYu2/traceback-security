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
    raw_events_reduced: int = 0
    event_reduction_percentage: float = 0.0
    decoy_total: int = 0
    decoy_flagged: int = 0
    decoy_cleared: int = 0
    decoy_clearance_rate: float = 100.0
    noise_reduction_percentage: float = 0.0
    citation_accuracy_percentage: float = 100.0
    estimated_triage_minutes_saved: float = 0.0



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


class NarrativeStep(BaseModel):
    stage: str
    claim: str
    evidence_ids: List[str]
    confidence: float = 0.95


class ContainmentAction(BaseModel):
    action: str
    why: str
    evidence_ids: List[str]


class StructuredNarrativeJSON(BaseModel):
    title: str
    severity: str
    summary: str
    steps: List[NarrativeStep]
    containment: List[ContainmentAction] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)

