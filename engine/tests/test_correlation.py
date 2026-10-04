from generator.synthetic_generator import SyntheticLogGenerator
from evaluation.harness import DetectionEvaluationHarness
from correlation.scoring import KillChainScorer
from correlation.cleared_handler import ClearedActivityHandler
from schemas.finding_schema import Finding


def test_kill_chain_scoring_formula():
    findings = [
        Finding(
            id="FND-1", rule="R1", rule_name="Spray", entity_type="IP",
            entity="198.51.100.42", severity="HIGH", stage="1_password_spray",
            event_ids=["EVT-1"], detail="detail1"
        ),
        Finding(
            id="FND-2", rule="R2", rule_name="PrivEsc", entity_type="HOST",
            entity="prod-bastion-01", severity="HIGH", stage="4_privilege_escalation",
            event_ids=["EVT-2"], detail="detail2"
        ),
        Finding(
            id="FND-3", rule="R3", rule_name="Exfil", entity_type="HOST",
            entity="prod-db-01", severity="CRITICAL", stage="5_data_exfiltration",
            event_ids=["EVT-3"], detail="detail3"
        ),
    ]

    stages = ["1_password_spray", "4_privilege_escalation", "5_data_exfiltration"]
    entities = ["198.51.100.42", "prod-bastion-01", "prod-db-01", "sysadmin"]

    score, breakdown = KillChainScorer.calculate_score(findings, stages, entities)

    # Base severity: HIGH(50) + HIGH(50) + CRITICAL(100) = 200 -> capped at 100
    assert breakdown.base_severity_score == 100.0
    # Stage mult: 1.0 + 0.25 * (3 - 1) = 1.5
    assert breakdown.stage_multiplier == 1.5
    # Entity boost: 5.0 * min(5, 4) = 20.0
    assert breakdown.entity_boost == 20.0
    # Temporal bonus: 10.0 (3 stages)
    assert breakdown.temporal_progression_bonus == 10.0
    # Final score capped at 100.0
    assert score == 100.0


def test_cleared_decoy_activity_explanations():
    gen = SyntheticLogGenerator(seed=42, total_target_events=1000)
    events, _ = gen.generate()

    cleared = ClearedActivityHandler.identify_cleared_activities(events)
    assert len(cleared) > 0

    rule_names = {c.rule_name for c in cleared}
    assert "Routine Forgotten Password Sequence" in rule_names
    assert "Authorized Internal Vulnerability Scanner" in rule_names


def test_main_benchmark_evaluation():
    gen = SyntheticLogGenerator(seed=42, total_target_events=52149, dataset_name="benchmark_main")
    events, manifest = gen.generate()

    findings, incidents, metrics = DetectionEvaluationHarness.run_evaluation(events, manifest)

    assert len(findings) > 0
    assert len(incidents) == 1
    assert metrics.recall == 100.0
    assert metrics.precision >= 70.0
    assert metrics.f1_score >= 80.0


def test_heldout_benchmark_evaluation():
    gen = SyntheticLogGenerator(seed=1337, total_target_events=52149, dataset_name="benchmark_heldout")
    events, manifest = gen.generate()

    findings, incidents, metrics = DetectionEvaluationHarness.run_evaluation(events, manifest)

    assert len(findings) > 0
    assert len(incidents) == 1
    assert metrics.recall == 100.0
    assert metrics.precision >= 70.0
    assert metrics.f1_score >= 80.0
