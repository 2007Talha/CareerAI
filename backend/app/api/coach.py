"""
CareerAI — Coach API Routes

POST /coach/{id}/chat — Send a message to the AI career coach
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import CoachMessageCreate, CoachChatResponse, ErrorResponse
from app.services.profile_service import get_profile
from app.services.ranking_service import compute_student_ranking
from app.services.career_service import compute_all_career_matches
from app.services.gap_service import compute_skill_gaps
from app.services.roadmap_service import generate_roadmap
from app.services.coach_service import chat_with_coach
from app.utils.logging import get_logger

logger = get_logger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


@router.post(
    "/coach/{profile_id}/chat",
    response_model=CoachChatResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Chat with AI career coach",
    description="Send a message to the AI career coach. The coach has access to "
                "the student's complete profile, scores, career matches, gaps, "
                "and roadmap. Responses are grounded in actual student data.",
)
@limiter.limit("20/minute")
async def coach_chat(
    request: Request,
    profile_id: uuid.UUID,
    message: CoachMessageCreate,
    career_id: str = "e0000001-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db),
):
    """
    AI Coach conversation endpoint.
    Assembles full student context before calling Gemini.
    """
    profile = await get_profile(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile {profile_id} not found.",
        )

    # Assemble context for the coach
    ranking = await compute_student_ranking(db, profile)
    career_matches = await compute_all_career_matches(profile)

    # Get gaps and roadmap for the selected career
    gaps = await compute_skill_gaps(profile, career_id)
    roadmap = None
    if gaps:
        roadmap = await generate_roadmap(profile, career_id, gaps)

    # Chat with coach
    response = await chat_with_coach(
        profile=profile,
        user_message=message.message,
        ranking=ranking,
        career_matches=career_matches,
        gaps=gaps,
        roadmap=roadmap,
    )

    return response
