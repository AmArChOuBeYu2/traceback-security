from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class GroundTruthLabel(BaseModel):
    event_id: str
    line_no: int
    is_attack: bool
    attack_stage: Optional[str] = None
    is_decoy: bool
    decoy_type: Optional[str] = None


class AttackStageSummary(BaseModel):
    stage_name: str
    mitre_id: str
    event_count: int
    first_event_id: str
    last_event_id: str
    description: str


class GroundTruthManifest(BaseModel):
    dataset_name: str
    generator_seed: int
    total_events: int
    attack_events_count: int
    decoy_events_count: int
    benign_events_count: int
    attack_stages: List[AttackStageSummary]
    event_labels: Dict[str, GroundTruthLabel]


class EvaluationMetrics(BaseModel):
    true_positives: int
    false_positives: int
    false_negatives: int
    true_negatives: int
    precision: float
    recall: float
    f1_score: float
    time_to_detect_seconds: float
    decoy_total: int = 0
    decoy_flagged: int = 0
    decoy_cleared: int = 0
    decoy_clearance_rate: float = 100.0
    event_reduction_percentage: float = 0.0

