from typing import List, Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from schemas.event_schema import UnifiedEvent
from schemas.finding_schema import Finding
from schemas.incident_schema import Incident, ClearedActivity
from schemas.ground_truth import EvaluationMetrics
from evaluation.harness import DetectionEvaluationHarness
from correlation.cleared_handler import ClearedActivityHandler
from generator.synthetic_generator import SyntheticLogGenerator

router = APIRouter(prefix="/api/engine", tags=["Detection & Correlation Engine"])


class DetectionRequest(BaseModel):
    dataset_type: str = "main"  # "main" or "heldout"
    events: Optional[List[UnifiedEvent]] = None


class DetectionResponse(BaseModel):
    findings_count: int
    incidents_count: int
    findings: List[Finding]
    incidents: List[Incident]
    cleared_activities: List[ClearedActivity]
    evaluation_metrics: EvaluationMetrics


@router.post("/detect-and-correlate", response_model=DetectionResponse)
def detect_and_correlate(req: Optional[DetectionRequest] = None):
    dataset_name = req.dataset_type if req else "main"
    seed = 42 if dataset_name == "main" else 1337

    if req and req.events:
        events = req.events
        # Create dummy manifest for custom events
        gen = SyntheticLogGenerator(seed=seed, total_target_events=len(events))
        _, manifest = gen.generate()
    else:
        gen = SyntheticLogGenerator(seed=seed, total_target_events=52149, dataset_name=f"benchmark_{dataset_name}")
        events, manifest = gen.generate()

    findings, incidents, metrics = DetectionEvaluationHarness.run_evaluation(events, manifest)
    cleared = ClearedActivityHandler.identify_cleared_activities(events)

    return DetectionResponse(
        findings_count=len(findings),
        incidents_count=len(incidents),
        findings=findings,
        incidents=incidents,
        cleared_activities=cleared,
        evaluation_metrics=metrics,
    )
