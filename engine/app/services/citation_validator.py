from typing import List, Dict
from app.models.schemas import NarrativeClaim, RawLogEntry


class CitationValidator:
    """
    Validates that every claim in an evidence-locked narrative maps to valid,
    existing event_ids in the underlying raw dataset.
    """

    @staticmethod
    def validate_narrative(
        narrative: List[NarrativeClaim], raw_logs: List[RawLogEntry]
    ) -> Dict[str, bool]:
        valid_event_ids = {log.event_id for log in raw_logs}
        validation_results = {}

        for claim in narrative:
            # Check if all cited evidence IDs exist in dataset
            all_valid = all(ev_id in valid_event_ids for ev_id in claim.evidence_event_ids)
            claim.is_verified = all_valid
            validation_results[claim.claim_id] = all_valid

        return validation_results
