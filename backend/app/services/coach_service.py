"""
CareerAI — Coach Service

Assembles full student context and manages AI coaching conversations.
The coach answers grounded in the student's actual data — not generic advice.
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.models.schemas import (
    CoachChatResponse,
    CoachMessageResponse,
    MessageRole,
    StudentProfileResponse,
    RankingResponse,
    GapsResponse,
    RoadmapResponse,
    CareerMatchesResponse,
)
from app.services.gemini_service import generate_coach_response, GeminiServiceError
from app.utils.logging import get_logger

logger = get_logger(__name__)

# In-memory conversation store (replace with DB in production)
_conversations: Dict[str, List[Dict]] = {}


def _format_student_context(
    profile: StudentProfileResponse,
    ranking: Optional[RankingResponse] = None,
    career_matches: Optional[CareerMatchesResponse] = None,
    gaps: Optional[GapsResponse] = None,
    roadmap: Optional[RoadmapResponse] = None,
) -> str:
    """
    Format the student's complete context for the coach system prompt.
    This is what makes the coach grounded — it sees everything.
    """
    parts = []

    # Profile summary
    parts.append(f"## Student Profile")
    parts.append(f"Name: {profile.full_name}")
    if profile.university:
        parts.append(f"University: {profile.university}")
    if profile.degree:
        parts.append(f"Degree: {profile.degree}")
    if profile.gpa:
        scale = profile.gpa_scale or 10.0
        pct = (profile.gpa / scale) * 100 if scale > 0 else 0
        parts.append(f"GPA: {profile.gpa}/{scale} ({pct:.1f}%)")

    # Skills
    if profile.skills:
        parts.append(f"\n## Skills ({len(profile.skills)} total)")
        for s in profile.skills:
            evidence = f" — {s.evidence}" if s.evidence else ""
            parts.append(f"- {s.skill_name}: Level {s.proficiency}/5{evidence}")

    # Projects
    if profile.projects:
        parts.append(f"\n## Projects ({len(profile.projects)} total)")
        for p in profile.projects:
            techs = ", ".join(p.technologies) if p.technologies else "N/A"
            parts.append(f"- {p.title} (Technologies: {techs}, Complexity: {p.complexity}/5)")
            if p.highlights:
                for h in p.highlights[:3]:
                    parts.append(f"  • {h}")

    # Experience
    if profile.experiences:
        parts.append(f"\n## Experience ({len(profile.experiences)} total)")
        for e in profile.experiences:
            duration = f"{e.duration_months} months" if e.duration_months else "duration unknown"
            parts.append(f"- {e.title} at {e.company or 'N/A'} ({duration}, {e.experience_type.value})")

    # Ranking
    if ranking:
        parts.append(f"\n## Readiness Score")
        parts.append(f"Overall Score: {ranking.overall_score}/100")
        parts.append(f"Percentile: {ranking.percentile}th (Rank {ranking.cohort_rank}/{ranking.cohort_size})")
        parts.append(f"Breakdown:")
        parts.append(f"  - Technical Skills: {ranking.breakdown.technical_skills}/100 (weight: 25%)")
        parts.append(f"  - Projects: {ranking.breakdown.projects}/100 (weight: 25%)")
        parts.append(f"  - Academics: {ranking.breakdown.academics}/100 (weight: 20%)")
        parts.append(f"  - Experience: {ranking.breakdown.experience}/100 (weight: 10%)")
        parts.append(f"  - Assessments: {ranking.breakdown.assessments}/100 (weight: 10%)")
        parts.append(f"  - Achievements: {ranking.breakdown.achievements}/100 (weight: 10%)")

    # Career matches
    if career_matches and career_matches.matches:
        parts.append(f"\n## Career Fit")
        for m in career_matches.matches:
            parts.append(f"- {m.career.name}: {m.fit_percentage}% fit (Rank #{m.match_rank})")
            for r in m.reasons:
                parts.append(f"  • {r}")

    # Gaps
    if gaps and gaps.gaps:
        parts.append(f"\n## Skill Gaps (for {gaps.career_name})")
        for g in gaps.gaps:
            parts.append(
                f"- {g.skill_name}: Level {g.current_level}/{g.target_level} "
                f"({g.classification.value}, priority: {g.priority_score})"
            )

    # Roadmap
    if roadmap and roadmap.items:
        parts.append(f"\n## Roadmap")
        for item in roadmap.items:
            status = "✅ Completed" if item.is_completed else "⬜ Pending"
            parts.append(f"- [{status}] #{item.priority_order}: {item.action_title}")
            if item.estimated_hours:
                parts.append(f"  Estimated: {item.estimated_hours} hours")

    return "\n".join(parts)


def _format_conversation_history(student_id: str) -> str:
    """Format the conversation history for the prompt."""
    messages = _conversations.get(student_id, [])
    if not messages:
        return "No previous messages."

    # Only include last 10 messages to stay within context limits
    recent = messages[-10:]
    parts = []
    for msg in recent:
        role = msg["role"].upper()
        parts.append(f"[{role}]: {msg['content']}")
    return "\n".join(parts)


async def chat_with_coach(
    profile: StudentProfileResponse,
    user_message: str,
    ranking: Optional[RankingResponse] = None,
    career_matches: Optional[CareerMatchesResponse] = None,
    gaps: Optional[GapsResponse] = None,
    roadmap: Optional[RoadmapResponse] = None,
) -> CoachChatResponse:
    """
    Send a message to the AI coach and get a grounded response.

    The coach receives the student's full context and must reference
    specific data points in its response.

    Args:
        profile: Student's profile.
        user_message: The student's question.
        ranking: Optional ranking data.
        career_matches: Optional career fit data.
        gaps: Optional gap data.
        roadmap: Optional roadmap data.

    Returns:
        CoachChatResponse with the reply and conversation history.
    """
    student_id = str(profile.id)

    # Initialize conversation if needed
    if student_id not in _conversations:
        _conversations[student_id] = []

    # Store user message
    now = datetime.now(timezone.utc)
    _conversations[student_id].append({
        "role": "user",
        "content": user_message,
        "created_at": now,
    })

    # Format context and history
    context = _format_student_context(
        profile, ranking, career_matches, gaps, roadmap
    )
    history = _format_conversation_history(student_id)

    try:
        # Generate response
        reply = await generate_coach_response(
            student_context=context,
            user_message=user_message,
            conversation_history=history,
        )
    except GeminiServiceError as exc:
        logger.error("coach_chat_failed", student_id=student_id, error=str(exc))
        reply = (
            "I'm sorry, I'm having trouble generating a response right now. "
            "Please try again in a moment. In the meantime, I'd suggest reviewing "
            "your skill gaps and roadmap for actionable next steps."
        )

    # Store assistant response
    _conversations[student_id].append({
        "role": "assistant",
        "content": reply,
        "created_at": datetime.now(timezone.utc),
    })

    # Build response with full history
    history_responses = [
        CoachMessageResponse(
            role=MessageRole(msg["role"]),
            content=msg["content"],
            created_at=msg["created_at"],
        )
        for msg in _conversations[student_id]
    ]

    logger.info(
        "coach_chat_complete",
        student_id=student_id,
        message_length=len(reply),
        history_length=len(history_responses),
    )

    return CoachChatResponse(
        student_id=profile.id,
        reply=reply,
        history=history_responses,
    )
