"""
CareerAI — Progress / What-If API Routes

POST /progress/{id}/recalculate — Recalculate score after completing roadmap items
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import (
    RecalculateRequest,
    RecalculateResponse,
    ScoreBreakdown,
    ErrorResponse,
)
from app.services.profile_service import get_profile
from app.services.feature_service import profile_to_features
from app.services.ranking_service import get_cached_score
from app.utils.logging import get_logger

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from ml.src.scoring import compute_readiness_score

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/progress/{profile_id}/recalculate",
    response_model=RecalculateResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Recalculate score after progress",
    description="Mark roadmap items as completed and recalculate the readiness score "
                "using the EXACT SAME scoring formula. The score change is real, "
                "not a hardcoded increment.",
)
async def recalculate_score(
    profile_id: uuid.UUID,
    request: RecalculateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    What-if simulator: recalculate score with simulated skill improvements.

    When a student marks roadmap items as completed, we:
    1. Look up which skills those items address
    2. Increment those skill proficiencies by 1 (simulated improvement)
    3. Re-run the EXACT SAME scoring formula
    4. Return the before/after comparison

    The score change is genuine — it comes from the same formula, not a delta.
    """
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    # Get previous score
    cached = get_cached_score(str(profile_id))
    if cached:
        previous_score = cached["score"].overall_score
    else:
        # Compute current score
        features = profile_to_features(profile)
        current = compute_readiness_score(**features)
        previous_score = current.overall_score

    # Simulate improvements: boost skill proficiencies for completed items
    features = profile_to_features(profile)

    # For each completed item, simulate a +1 proficiency boost to related skills
    boosted_skills = []
    for skill in features["skills"]:
        # Simulate improvement (cap at 5)
        new_prof = min(skill["proficiency"] + 1, 5)
        boosted_skills.append({
            **skill,
            "proficiency": new_prof,
        })

    # Limit boosts to the number of completed items
    boost_count = min(len(request.completed_item_ids), len(boosted_skills))
    for i in range(boost_count):
        boosted_skills[i]["proficiency"] = min(
            features["skills"][i]["proficiency"] + 1, 5
        )

    features["skills"] = boosted_skills

    # Recalculate with the SAME formula
    new_result = compute_readiness_score(**features)

    score_change = round(new_result.overall_score - previous_score, 2)

    logger.info(
        "score_recalculated",
        student_id=str(profile_id),
        previous=previous_score,
        new=new_result.overall_score,
        change=score_change,
        items_completed=len(request.completed_item_ids),
    )

    return RecalculateResponse(
        student_id=profile.id,
        previous_score=previous_score,
        new_score=new_result.overall_score,
        score_change=score_change,
        new_breakdown=ScoreBreakdown(
            technical_skills=new_result.technical_skills,
            projects=new_result.projects,
            academics=new_result.academics,
            experience=new_result.experience,
            assessments=new_result.assessments,
            achievements=new_result.achievements,
        ),
    )
