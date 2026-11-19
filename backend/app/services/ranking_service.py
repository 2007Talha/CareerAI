"""
CareerAI — Ranking Service

Orchestrates the scoring pipeline:
    profile → features → score → normalize → percentile → rank

This is the main entry point for computing a student's readiness assessment.
"""

import sys
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

# Add root to sys.path so ml package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from ml.src.scoring import compute_readiness_score, ScoreResult
from ml.src.ranking import rank_student, RankResult

from app.models.schemas import (
    RankingResponse,
    ScoreBreakdown,
    StudentProfileResponse,
)
from app.services.feature_service import profile_to_features
from app.services.profile_service import get_profile, list_profiles
from app.utils.logging import get_logger

logger = get_logger(__name__)


# In-memory score cache (replace with DB in production)
_scores_cache: dict = {}


async def compute_student_ranking(
    db: AsyncSession,
    profile: StudentProfileResponse,
) -> RankingResponse:
    """
    Full scoring pipeline for a student:
    1. Convert profile to features
    2. Compute readiness score via deterministic formula
    3. Get all cohort scores
    4. Compute percentile and rank

    Args:
        db: Database session.
        profile: The student's profile.

    Returns:
        RankingResponse with score, percentile, rank, and breakdown.
    """
    # Step 1: Profile → Features
    features = profile_to_features(profile)

    # Step 2: Features → Score (deterministic formula)
    score_result: ScoreResult = compute_readiness_score(**features)

    # Step 3: Get cohort scores for ranking
    all_profiles = await list_profiles(db)
    cohort_scores = []
    for p in all_profiles:
        if str(p.id) == str(profile.id):
            cohort_scores.append(score_result.overall_score)
            continue
        p_features = profile_to_features(p)
        p_score = compute_readiness_score(**p_features)
        cohort_scores.append(p_score.overall_score)

    # Ensure at least some synthetic cohort data for demo
    if len(cohort_scores) < 5:
        cohort_scores = _generate_demo_cohort_scores(score_result.overall_score)

    # Step 4: Score → Rank within cohort
    rank_result: RankResult = rank_student(
        score_result.overall_score, cohort_scores
    )

    # Cache the result
    _scores_cache[str(profile.id)] = {
        "score": score_result,
        "rank": rank_result,
    }

    now = datetime.now(timezone.utc)

    logger.info(
        "student_ranked",
        student_id=str(profile.id),
        score=score_result.overall_score,
        percentile=rank_result.percentile,
        rank=rank_result.rank,
        cohort_size=rank_result.cohort_size,
    )

    return RankingResponse(
        student_id=profile.id,
        overall_score=score_result.overall_score,
        percentile=rank_result.percentile,
        cohort_rank=rank_result.rank,
        cohort_size=rank_result.cohort_size,
        breakdown=ScoreBreakdown(
            technical_skills=score_result.technical_skills,
            projects=score_result.projects,
            academics=score_result.academics,
            experience=score_result.experience,
            assessments=score_result.assessments,
            achievements=score_result.achievements,
        ),
        computed_at=now,
    )


def _generate_demo_cohort_scores(student_score: float) -> List[float]:
    """
    Generate a synthetic cohort for demo purposes when the DB is empty.
    Produces a spread of scores around a realistic distribution.
    """
    import random
    random.seed(42)  # Deterministic for reproducibility

    scores = []
    # Generate 50 synthetic scores with a normal-ish distribution
    for _ in range(50):
        base = random.gauss(55, 18)  # mean=55, std=18
        score = max(5, min(95, base))  # clamp to 5-95
        scores.append(round(score, 2))

    # Include the student's actual score
    scores.append(student_score)
    return scores


def get_cached_score(student_id: str) -> Optional[dict]:
    """Retrieve a cached score result for use by other services."""
    return _scores_cache.get(student_id)
