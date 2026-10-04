from typing import List, Tuple
from schemas.finding_schema import Finding
from schemas.incident_schema import ScoreBreakdown


class KillChainScorer:
    """
    Explainable Kill-Chain Scoring Engine.
    Formula:
    Score = min(100, (BaseSeverityScore * StageMultiplier) + EntityBoost + TemporalBonus)
    
    1. BaseSeverityScore: Sum of finding severity weights (LOW=10, MEDIUM=25, HIGH=50, CRITICAL=100)
    2. StageMultiplier: 1.0 + 0.25 * (distinct_stages - 1)
    3. EntityBoost: +5.0 * min(5, distinct_entities)
    4. TemporalBonus: +10.0 for multi-phase progression across >= 3 stages
    """

    SEVERITY_WEIGHTS = {
        "LOW": 10.0,
        "MEDIUM": 25.0,
        "HIGH": 50.0,
        "CRITICAL": 100.0,
    }

    @classmethod
    def calculate_score(
        cls, findings: List[Finding], stages: List[str], entities: List[str]
    ) -> Tuple[float, ScoreBreakdown]:
        if not findings:
            breakdown = ScoreBreakdown(
                base_severity_score=0.0,
                stage_multiplier=1.0,
                entity_boost=0.0,
                temporal_progression_bonus=0.0,
                final_score=0.0,
                explanation="No findings present.",
            )
            return 0.0, breakdown

        # 1. Base Severity Score
        base_sev = sum(cls.SEVERITY_WEIGHTS.get(f.severity.upper(), 10.0) for f in findings)
        base_sev_score = min(100.0, base_sev)

        # 2. Stage Multiplier
        num_stages = len(stages)
        stage_mult = 1.0 + (0.25 * max(0, num_stages - 1))

        # 3. Entity Boost
        num_entities = len(entities)
        entity_boost = 5.0 * min(5, num_entities)

        # 4. Temporal Bonus
        temporal_bonus = 10.0 if num_stages >= 3 else 0.0

        # Calculate final score
        raw_final = (base_sev_score * stage_mult) + entity_boost + temporal_bonus
        final_score = min(100.0, round(raw_final, 1))

        explanation = (
            f"Base Severity ({base_sev_score:.0f}) * Stage Multiplier ({stage_mult:.2f}) "
            f"+ Entity Boost ({entity_boost:.0f}) + Temporal Progression Bonus ({temporal_bonus:.0f}) = {final_score}/100"
        )

        breakdown = ScoreBreakdown(
            base_severity_score=base_sev_score,
            stage_multiplier=stage_mult,
            entity_boost=entity_boost,
            temporal_progression_bonus=temporal_bonus,
            final_score=final_score,
            explanation=explanation,
        )

        return final_score, breakdown
