"""
CareerAI — Gap Service

Identifies skill gaps between a student's current proficiency
and a target career's requirements. Classifies gaps as critical/developing/strong
and prioritizes by importance × gap_size.

Returns only the top 3–5 most impactful gaps, not an exhaustive list.
"""

import uuid
from typing import Dict, List, Optional

from app.models.schemas import (
    GapItem,
    GapsResponse,
    Importance,
    GapClassification,
    StudentProfileResponse,
)
from app.services.career_service import (
    CAREER_REQUIREMENTS,
    CAREERS,
    get_career,
)
from app.utils.logging import get_logger

logger = get_logger(__name__)

# Importance multiplier for priority calculation
IMPORTANCE_WEIGHTS = {
    "required": 3.0,
    "important": 2.0,
    "optional": 1.0,
}

# Maximum gaps to return (resist showing every gap)
MAX_GAPS = 5


def classify_gap(current_level: int, target_level: int) -> GapClassification:
    """
    Classify a skill gap:
    - critical: student is 2+ levels below target, or skill is completely missing
    - developing: student is 1 level below target
    - strong: student meets or exceeds target
    """
    gap = target_level - current_level
    if gap >= 2 or current_level == 0:
        return GapClassification.CRITICAL
    elif gap == 1:
        return GapClassification.DEVELOPING
    else:
        return GapClassification.STRONG


def compute_priority(importance: str, gap_size: int) -> float:
    """
    Priority = importance_weight × gap_size

    A small gap in a required skill outranks a huge gap in an optional skill.
    This is intentional — we want students to focus on what matters most
    for their target career.
    """
    weight = IMPORTANCE_WEIGHTS.get(importance, 1.0)
    return round(weight * max(gap_size, 0), 2)


async def compute_skill_gaps(
    profile: StudentProfileResponse,
    career_id: str,
) -> Optional[GapsResponse]:
    """
    Compute prioritized skill gaps for a student vs. a target career.

    Process:
    1. Get career requirements
    2. Compare each requirement against student's current skills
    3. Compute gap_size = target_level - current_level
    4. Compute priority = importance_weight × gap_size
    5. Sort by priority (highest first)
    6. Return top MAX_GAPS gaps only

    Args:
        profile: The student's profile with skills.
        career_id: The target career to compare against.

    Returns:
        GapsResponse with prioritized gaps, or None if career not found.
    """
    career = get_career(career_id)
    if not career:
        return None

    requirements = CAREER_REQUIREMENTS.get(career_id, [])
    if not requirements:
        return None

    # Build student skill map: canonical_name_lower → proficiency
    student_skills: Dict[str, int] = {}
    for skill in profile.skills:
        student_skills[skill.skill_name.lower()] = skill.proficiency

    # Compute gaps
    all_gaps: List[GapItem] = []

    for req in requirements:
        skill_name = req["skill"]
        target_level = req["target"]
        importance = req["importance"]

        current_level = student_skills.get(skill_name.lower(), 0)
        gap_size = max(target_level - current_level, 0)
        classification = classify_gap(current_level, target_level)

        # Only include actual gaps (not strong skills)
        if classification != GapClassification.STRONG:
            priority = compute_priority(importance, gap_size)
            all_gaps.append(GapItem(
                skill_name=skill_name,
                current_level=current_level,
                target_level=target_level,
                gap_size=gap_size,
                importance=Importance(importance),
                priority_score=priority,
                classification=classification,
            ))

    # Sort by priority (highest first) and take top MAX_GAPS
    all_gaps.sort(key=lambda g: g.priority_score, reverse=True)
    top_gaps = all_gaps[:MAX_GAPS]

    logger.info(
        "gaps_computed",
        student_id=str(profile.id),
        career=career.name,
        total_gaps=len(all_gaps),
        critical_gaps=sum(1 for g in top_gaps if g.classification == GapClassification.CRITICAL),
    )

    crit_count = sum(1 for g in all_gaps if g.classification == GapClassification.CRITICAL)
    dev_count = sum(1 for g in all_gaps if g.classification == GapClassification.DEVELOPING)
    strong_count = sum(1 for req in requirements if student_skills.get(req["skill"].lower(), 0) >= req["target"])

    return GapsResponse(
        student_id=profile.id,
        career_id=career.id,
        career_name=career.name,
        critical_gaps_count=crit_count,
        developing_gaps_count=dev_count,
        strong_skills_count=strong_count,
        gaps=top_gaps,
    )
