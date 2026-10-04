from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_analyze_endpoint():
    response = client.post("/api/analyze")
    assert response.status_code == 200
    data = response.json()
    assert data["incident_id"] == "INC-2026-0841"
    assert data["scorecard"]["total_raw_events"] == 52149
    assert len(data["narrative"]) > 0
    assert len(data["replay_steps"]) > 0


def test_get_incidents_endpoint():
    response = client.get("/api/incidents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["incident_id"] == "INC-2026-0841"


def test_get_raw_logs_by_event_ids():
    response = client.get("/api/logs/raw?event_ids=EV-10101,EV-10102")
    assert response.status_code == 200
    data = response.json()
    assert data["total_matched"] == 2
    assert data["logs"][0]["event_id"] == "EV-10101"


def test_scorecard_endpoint():
    response = client.get("/api/scorecard")
    assert response.status_code == 200
    data = response.json()
    assert data["citation_accuracy_percentage"] == 100.0
    assert data["noise_reduction_percentage"] > 99.0
