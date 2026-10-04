from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from schemas.finding_schema import Finding


class IncidentTimeline(BaseModel):
    start_time: str
    end_time: str
    duration_seconds: float


class ScoreBreakdown(BaseModel):
    base_severity_score: float
    stage_multiplier: float
    entity_boost: float
    temporal_progression_bonus: float
    final_score: float
    explanation: str


class Incident(BaseModel):
    id: str = Field(..., description="Unique incident ID (e.g. INC-001)")
    title: str = Field(..., description="Correlated incident title")
    score: float = Field(..., description="Explainable kill-chain severity score (0-100)")
    score_breakdown: ScoreBreakdown = Field(..., description="Step-by-step scoring formula breakdown")
    stages: List[str] = Field(..., description="List of distinct MITRE ATT&CK stages in kill-chain")
    entities: List[str] = Field(..., description="Correlated entities (IPs, users, hosts)")
    finding_ids: List[str] = Field(..., description="IDs of correlated findings included in incident")
    findings: List[Finding] = Field(default_factory=list, description="Full finding objects")
    narrative_json: Optional[Dict[str, Any]] = Field(None, description="Structured claim-to-evidence JSON narrative")
    verified_ratio: float = Field(1.0, description="Ratio of claims backed by verified log receipts")
    timeline: IncidentTimeline = Field(..., description="Start, end, and duration timeline")


class ClearedActivity(BaseModel):
    id: str
    rule_name: str
    entity: str
    what_looked_suspicious: str
    why_cleared: str
    event_ids: List[str]
