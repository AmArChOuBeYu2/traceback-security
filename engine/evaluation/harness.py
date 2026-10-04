from typing import List, Dict, Tuple
from schemas.event_schema import UnifiedEvent
from schemas.ground_truth import GroundTruthManifest, EvaluationMetrics
from schemas.finding_schema import Finding
from schemas.incident_schema import Incident
from detectors.rule_detectors import (
    PasswordSprayDetector,
    SuccessAfterFailuresDetector,
    ImpossibleTravelDetector,
    BaselineDeviationDetector,
    PrivilegeEscalationDetector,
    ExfiltrationOutlierDetector,
)
from correlation.entity_graph import EntityGraphCorrelator
from correlation.cleared_handler import ClearedActivityHandler


class DetectionEvaluationHarness:
    """
    Evaluation harness calculating empirical Precision, Recall, False Positives,
    False Negatives, and Time-to-Detect metrics against Ground Truth manifests.
    """

    @classmethod
    def run_evaluation(
        cls, events: List[UnifiedEvent], manifest: GroundTruthManifest
    ) -> Tuple[List[Finding], List[Incident], EvaluationMetrics]:
        # 1. Run all 6 deterministic detectors
        detectors = [
            PasswordSprayDetector(min_failures=10, min_users=2),
            SuccessAfterFailuresDetector(failure_threshold=3),
            ImpossibleTravelDetector(),
            BaselineDeviationDetector(),
            PrivilegeEscalationDetector(),
            ExfiltrationOutlierDetector(z_score_threshold=3.5),
        ]

        all_findings: List[Finding] = []
        for det in detectors:
            all_findings.extend(det.detect(events))

        # 2. Run Entity Graph Correlator
        incidents = EntityGraphCorrelator.correlate_findings(all_findings, events)

        # 3. Calculate evaluation metrics against Ground Truth
        # Collect all event_ids flagged in findings
        flagged_event_ids = {eid for f in all_findings for eid in f.event_ids}
        ground_truth_attack_ids = {
            eid for eid, label in manifest.event_labels.items() if label.is_attack
        }
        ground_truth_decoy_ids = {
            eid for eid, label in manifest.event_labels.items() if label.is_decoy
        }

        tp = len(flagged_event_ids.intersection(ground_truth_attack_ids))
        fp = len(flagged_event_ids - ground_truth_attack_ids)
        fn = len(ground_truth_attack_ids - flagged_event_ids)
        tn = manifest.total_events - (tp + fp + fn)

        precision = (tp / (tp + fp)) * 100.0 if (tp + fp) > 0 else 0.0
        recall = (tp / (tp + fn)) * 100.0 if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        # Explicit Decoy Clearance
        decoy_total = len(ground_truth_decoy_ids)
        decoy_flagged = len(flagged_event_ids.intersection(ground_truth_decoy_ids))
        decoy_cleared = max(0, decoy_total - decoy_flagged)
        decoy_clearance_rate = round((decoy_cleared / decoy_total) * 100.0, 2) if decoy_total > 0 else 100.0

        # Raw Event Reduction / Compression
        raw_events_reduced = max(0, manifest.total_events - len(flagged_event_ids))
        event_reduction_pct = round((raw_events_reduced / max(1, manifest.total_events)) * 100.0, 2)

        # Calculate Time-to-Detect (seconds between first attack event and first finding event)
        first_attack_line = min((l.line_no for l in manifest.event_labels.values() if l.is_attack), default=1)
        first_flagged_line = min((l.line_no for eid, l in manifest.event_labels.items() if eid in flagged_event_ids), default=1)
        
        # Approximate time to detect in seconds (0.5s per event line in stream)
        ttd_seconds = max(0.0, (first_flagged_line - first_attack_line) * 0.5)

        metrics = EvaluationMetrics(
            true_positives=tp,
            false_positives=fp,
            false_negatives=fn,
            true_negatives=tn,
            precision=round(precision, 2),
            recall=round(recall, 2),
            f1_score=round(f1, 2),
            time_to_detect_seconds=round(ttd_seconds, 2),
            decoy_total=decoy_total,
            decoy_flagged=decoy_flagged,
            decoy_cleared=decoy_cleared,
            decoy_clearance_rate=decoy_clearance_rate,
            event_reduction_percentage=event_reduction_pct,
        )

        return all_findings, incidents, metrics
