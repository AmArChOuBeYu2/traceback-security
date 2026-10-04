import pandas as pd
from schemas.event_schema import UnifiedEvent


def test_unified_event_schema_fields():
    event = UnifiedEvent(
        id="EVT-000001",
        ts="2026-10-04 14:00:00 UTC",
        user="sysadmin",
        src_ip="198.51.100.42",
        host="prod-bastion-01",
        action="LOGIN",
        outcome="FAILURE",
        resource="ssh2",
        bytes_out=0,
        country="RU",
        raw="sshd[4912]: Failed password for invalid user admin from 198.51.100.42",
        line_no=1,
        is_attack=True,
        attack_stage="1_password_spray",
    )

    assert event.id == "EVT-000001"
    assert event.user == "sysadmin"
    assert event.bytes_out == 0
    assert event.is_attack is True


def test_pandas_dataframe_conversion():
    events = [
        UnifiedEvent(
            id=f"EVT-{i:06d}",
            ts="2026-10-04 14:00:00 UTC",
            user="user1",
            src_ip="10.0.0.1",
            host="host1",
            action="HTTP_GET",
            outcome="SUCCESS",
            resource="/index.html",
            bytes_out=1420,
            country="US",
            raw=f"Raw log {i}",
            line_no=i,
        )
        for i in range(1, 10)
    ]

    df = pd.DataFrame([e.to_pandas_dict() for e in events])
    assert len(df) == 9
    assert list(df.columns) == [
        "id", "ts", "user", "src_ip", "host", "action", "outcome",
        "resource", "bytes_out", "country", "raw", "line_no",
        "is_attack", "attack_stage", "is_decoy", "decoy_type"
    ]
