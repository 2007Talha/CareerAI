"""
CareerAI — Ranking API Routes

GET /ranking/{id} — Score, percentile, rank, and breakdown for a student
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import RankingResponse, ErrorResponse
from app.services.profile_service import get_profile
from app.services.ranking_service import compute_student_ranking
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get(
    "/ranking/{profile_id}",
    response_model=RankingResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get student ranking",
    description="Compute the student's readiness score, cohort percentile, "
                "rank, and full breakdown using the transparent weighted formula.",
)
async def get_student_ranking(
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Full scoring pipeline:
    profile → features → deterministic score → cohort percentile → rank
    """
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    ranking = await compute_student_ranking(db, profile)
    return ranking
