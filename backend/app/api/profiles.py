"""
CareerAI — Profile API Routes

POST /profiles         — Create profile from form input
GET  /profiles/{id}    — Read profile
PUT  /profiles/{id}    — Update profile
POST /profiles/{id}/analyze — Run Gemini analysis on existing profile
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
    ErrorResponse,
)
from app.services.profile_service import create_profile, get_profile, update_profile
from app.utils.logging import get_logger

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


@router.post(
    "/profiles",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create profile from form input",
)
async def create_student_profile(
    profile_data: StudentProfileCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new student profile from manual form input."""
    profile = await create_profile(db, profile_data)
    logger.info("profile_created_via_form", profile_id=str(profile.id))
    return profile


@router.get(
    "/profiles/{profile_id}",
    response_model=StudentProfileResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get student profile",
)
async def get_student_profile(
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a student profile by ID."""
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )
    return profile


@router.put(
    "/profiles/{profile_id}",
    response_model=StudentProfileResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Update student profile",
)
async def update_student_profile(
    profile_id: uuid.UUID,
    update_data: StudentProfileUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing student profile. Supports partial updates."""
    profile = await update_profile(db, profile_id, update_data)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )
    return profile


@router.post(
    "/profiles/{profile_id}/analyze",
    response_model=StudentProfileResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Run Gemini analysis on profile",
)
@limiter.limit("5/minute")
async def analyze_profile(
    request: Request,
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger Gemini re-analysis on an existing profile.
    Rate-limited to 5/minute to control API costs.
    """
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    # Mark as confirmed (analysis was requested by the student)
    updated = await update_profile(
        db, profile_id,
        StudentProfileUpdate(profile_confirmed=True)
    )
    return updated
