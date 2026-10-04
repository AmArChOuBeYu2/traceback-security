from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, UploadFile, File
from app.models.schemas import (
    CorrelatedIncident,
    Scorecard,
    RawLogEntry,
    AnalysisRequest,
)
from app.services.dataset_generator import generate_benchmark_52k_dataset
from app.services.normalizer import LogNormalizer
from app.services.baseline import BaselineEngine
from app.services.detectors import DeterministicDetectors
from app.services.correlator import IncidentCorrelator
from app.services.citation_validator import CitationValidator

router = APIRouter(prefix="/api", tags=["Investigation Engine"])

# In-memory storage for current session benchmark dataset and correlated incident
_cached_dataset: List[RawLogEntry] = []
_cached_incident: Optional[CorrelatedIncident] = None


def get_or_create_analysis():
    global _cached_dataset, _cached_incident
    if not _cached_dataset or not _cached_incident:
        # Load default 52k benchmark dataset
        _cached_dataset = generate_benchmark_52k_dataset()
        normalized = LogNormalizer.normalize_batch(_cached_dataset)
        _baselines = BaselineEngine.calculate_baselines(normalized)
        alerts, decoys = DeterministicDetectors.analyze_logs(normalized)
        incident = IncidentCorrelator.correlate_alerts(
            alerts, len(_cached_dataset), decoys
        )
        CitationValidator.validate_narrative(incident.narrative, _cached_dataset)
        _cached_incident = incident

    return _cached_dataset, _cached_incident


@router.post("/analyze", response_model=CorrelatedIncident)
def run_analysis(request: Optional[AnalysisRequest] = None):
    """
    Run full log-to-incident pipeline:
    Normalize -> Baseline -> Detect -> Correlate -> Verify Evidence -> Return Incident
    """
    global _cached_dataset, _cached_incident

    if request and request.raw_logs:
        logs = request.raw_logs
    else:
        logs = generate_benchmark_52k_dataset()

    _cached_dataset = logs
    normalized = LogNormalizer.normalize_batch(logs)
    _baselines = BaselineEngine.calculate_baselines(normalized)
    alerts, decoys = DeterministicDetectors.analyze_logs(normalized)
    incident = IncidentCorrelator.correlate_alerts(alerts, len(logs), decoys)
    CitationValidator.validate_narrative(incident.narrative, logs)
    _cached_incident = incident

    return incident


@router.get("/incidents", response_model=List[CorrelatedIncident])
def list_incidents():
    _, incident = get_or_create_analysis()
    return [incident]


@router.get("/incidents/{incident_id}", response_model=CorrelatedIncident)
def get_incident(incident_id: str):
    _, incident = get_or_create_analysis()
    if incident.incident_id != incident_id:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.get("/logs/raw")
def get_raw_logs(
    event_ids: Optional[str] = Query(None, description="Comma separated event IDs"),
    limit: int = Query(50, ge=1, le=500),
    q: Optional[str] = Query(None, description="Text filter search query"),
):
    dataset, _ = get_or_create_analysis()

    target_ids = set(event_ids.split(",")) if event_ids else None

    results = []
    for log in dataset:
        if target_ids and log.event_id not in target_ids:
            continue
        if q and q.lower() not in log.raw_text.lower() and q.lower() not in log.event_id.lower():
            continue
        results.append(log)
        if len(results) >= limit:
            break

    return {
        "total_matched": len(results),
        "logs": results
    }


@router.get("/scorecard", response_model=Scorecard)
def get_scorecard():
    _, incident = get_or_create_analysis()
    return incident.scorecard
