"""
CareerAI — Careers API Routes

GET /careers                        — List all careers
GET /careers/{id}/matches           — Career fit matches for a student
GET /careers/{career_id}/requirements — Career skill requirements
GET /gaps/{id}                      — Prioritized skill gaps
GET /roadmap/{id}                   — Personalized roadmap
"""

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import (
    CareerResponse,
    CareerMatchesResponse,
    CareerRequirementsResponse,
    GapsResponse,
    RoadmapResponse,
    ErrorResponse,
)
from app.services.career_service import (
    get_all_careers,
    get_career_requirements,
    compute_all_career_matches,
)
from app.services.gap_service import compute_skill_gaps
from app.services.roadmap_service import generate_roadmap
from app.services.profile_service import get_profile
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get(
    "/careers",
    response_model=List[CareerResponse],
    summary="List all careers",
)
async def list_careers():
    """Return all available career definitions."""
    return get_all_careers()


@router.get(
    "/careers/{profile_id}/matches",
    response_model=CareerMatchesResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get career matches for a student",
    description="Compute fit percentages for all careers, ranked by fit. "
                "Each match includes evidence-grounded reasons tied to the student's actual data.",
)
async def get_career_matches(
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Career fit computation for all 6 careers, ranked by percentage."""
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    matches = await compute_all_career_matches(profile)
    return matches


@router.get(
    "/careers/{career_id}/requirements",
    response_model=CareerRequirementsResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get career skill requirements",
)
async def get_requirements(career_id: str):
    """Get the skill requirements for a specific career."""
    reqs = get_career_requirements(career_id)
    if not reqs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career {career_id} not found.",
        )
    return reqs


@router.get(
    "/gaps/{profile_id}",
    response_model=GapsResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get prioritized skill gaps",
    description="Compute the top 3-5 skill gaps between a student and their target career, "
                "prioritized by importance × gap_size.",
)
async def get_skill_gaps(
    profile_id: uuid.UUID,
    career_id: str = Query(..., description="Target career ID"),
    db: AsyncSession = Depends(get_db),
):
    """Prioritized gap analysis for a student vs. a target career."""
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    gaps = await compute_skill_gaps(profile, career_id)
    if not gaps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career {career_id} not found.",
        )

    return gaps


@router.get(
    "/roadmap/{profile_id}",
    response_model=RoadmapResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get personalized roadmap",
    description="Generate a personalized roadmap of concrete action items "
                "based on the student's skill gaps for a target career.",
)
async def get_roadmap(
    profile_id: uuid.UUID,
    career_id: str = Query(..., description="Target career ID"),
    db: AsyncSession = Depends(get_db),
):
    """Roadmap generation: gaps → concrete, ordered action items."""
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    # First compute gaps, then generate roadmap from them
    gaps = await compute_skill_gaps(profile, career_id)
    if not gaps:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Career {career_id} not found.",
        )

    roadmap = await generate_roadmap(profile, career_id, gaps)
    return roadmap
