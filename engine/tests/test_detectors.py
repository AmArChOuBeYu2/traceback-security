from detectors.rule_detectors import (
    PasswordSprayDetector,
    SuccessAfterFailuresDetector,
    ImpossibleTravelDetector,
    BaselineDeviationDetector,
    PrivilegeEscalationDetector,
    ExfiltrationOutlierDetector,
)
from schemas.event_schema import UnifiedEvent


def test_password_spray_detector_boundaries():
    detector = PasswordSprayDetector(min_failures=5, min_users=2)

    # Below threshold (4 failures) -> No finding
    events_sub = [
        UnifiedEvent(
            id=f"EVT-{i}", ts="2026-10-04 14:00:00 UTC", user=f"user_{i}",
            src_ip="198.51.100.42", host="h1", action="LOGIN", outcome="FAILURE",
            resource="ssh", bytes_out=0, country="RU", raw="Failed password", line_no=i
        ) for i in range(1, 5)
    ]
    assert len(detector.detect(events_sub)) == 0

    # At threshold (5 failures across 2 users) -> 1 finding
    events_at = events_sub + [
        UnifiedEvent(
            id="EVT-5", ts="2026-10-04 14:00:05 UTC", user="user_diff",
            src_ip="198.51.100.42", host="h1", action="LOGIN", outcome="FAILURE",
            resource="ssh", bytes_out=0, country="RU", raw="Failed password", line_no=5
        )
    ]
    findings = detector.detect(events_at)
    assert len(findings) == 1
    assert findings[0].rule == "RULE-001-PASSWORD-SPRAY"
    assert findings[0].entity == "198.51.100.42"


def test_success_after_failures_detector():
    detector = SuccessAfterFailuresDetector(failure_threshold=3)

    events = [
        UnifiedEvent(
            id=f"EVT-{i}", ts=f"2026-10-04 14:00:0{i} UTC", user="sysadmin",
            src_ip="198.51.100.42", host="bastion", action="LOGIN",
            outcome="FAILURE" if i < 4 else "SUCCESS",
            resource="ssh", bytes_out=1420 if i == 4 else 0, country="RU",
            raw="Accepted password" if i == 4 else "Failed password", line_no=i
        ) for i in range(1, 5)
    ]

    findings = detector.detect(events)
    assert len(findings) == 1
    assert findings[0].rule == "RULE-002-SUCCESS-AFTER-FAILURES"
    assert findings[0].entity == "sysadmin"
    assert len(findings[0].event_ids) == 4  # 3 failures + 1 success


def test_impossible_travel_detector():
    detector = ImpossibleTravelDetector()

    events = [
        UnifiedEvent(
            id="EVT-GEO-1", ts="2026-10-04 14:00:00 UTC", user="sysadmin",
            src_ip="198.51.100.42", host="bastion", action="GEOIP_CHECK",
            outcome="ANOMALY", resource="vpn", bytes_out=0, country="RU",
            raw="geoip_alert: Impossible travel detected", line_no=1
        )
    ]

    findings = detector.detect(events)
    assert len(findings) == 1
    assert findings[0].rule == "RULE-003-IMPOSSIBLE-TRAVEL"
    assert findings[0].entity == "sysadmin"


def test_exfiltration_outlier_median_mad():
    detector = ExfiltrationOutlierDetector(z_score_threshold=3.5)

    # 10 normal 1KB background events + 1 massive 500MB exfiltration event
    events = [
        UnifiedEvent(
            id=f"EVT-BG-{i}", ts="2026-10-04 14:00:00 UTC", user="bob",
            src_ip="10.0.0.1", host="h1", action="HTTP_GET", outcome="ALLOWED",
            resource="/index", bytes_out=1024, country="US", raw="normal get", line_no=i
        ) for i in range(1, 11)
    ] + [
        UnifiedEvent(
            id="EVT-EXFIL-1", ts="2026-10-04 14:10:00 UTC", user="sysadmin",
            src_ip="192.168.1.99", host="prod-db-01", action="EXFILTRATE", outcome="SUCCESS",
            resource="c2.attacker.com", bytes_out=524288000, country="RU",
            raw="dns_query chunk exfil", line_no=11
        )
    ]

    findings = detector.detect(events)
    assert len(findings) == 1
    assert findings[0].rule == "RULE-006-EXFILTRATION-OUTLIER"
    assert "FND-EXFIL-001" in findings[0].id
    assert "500.0MB" in findings[0].detail


def test_robustness_missing_fields_and_malformed_data():
    detector = PasswordSprayDetector()
    events_malformed = [
        UnifiedEvent(
            id="EVT-MAL-1", ts="invalid_timestamp", user=None,
            src_ip=None, host=None, action="UNKNOWN", outcome="UNKNOWN",
            resource=None, bytes_out=0, country=None, raw="", line_no=1
        )
    ]
    # Should handle missing fields gracefully without raising exceptions
    findings = detector.detect(events_malformed)
    assert isinstance(findings, list)
