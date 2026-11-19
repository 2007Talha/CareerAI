"""
CareerAI — Career Service

Computes per-career fit percentages using the same scoring formula,
reweighted by each career's skill_weights. Returns ranked career matches
with evidence-grounded reasons.
"""

import uuid
from typing import Dict, List, Optional, Tuple

from app.models.schemas import (
    CareerFitResult,
    CareerMatchesResponse,
    CareerResponse,
    CareerRequirement,
    CareerRequirementsResponse,
    StudentProfileResponse,
    Importance,
)
from app.utils.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# Career Definitions (loaded from seed data)
# =============================================================================

CAREERS = {
    "e0000001-0000-0000-0000-000000000001": {
        "id": uuid.UUID("e0000001-0000-0000-0000-000000000001"),
        "name": "Software Engineer",
        "description": "Designs, develops, and maintains software systems.",
        "avg_salary_usd": 120000,
        "growth_outlook": "high",
    },
    "e0000001-0000-0000-0000-000000000002": {
        "id": uuid.UUID("e0000001-0000-0000-0000-000000000002"),
        "name": "ML Engineer",
        "description": "Builds and deploys machine learning models into production systems.",
        "avg_salary_usd": 140000,
        "growth_outlook": "high",
    },
    "e0000001-0000-0000-0000-000000000003": {
        "id": uuid.UUID("e0000001-0000-0000-0000-000000000003"),
        "name": "Data Scientist",
        "description": "Analyzes complex datasets to extract insights and build predictive models.",
        "avg_salary_usd": 125000,
        "growth_outlook": "high",
    },
    "e0000001-0000-0000-0000-000000000004": {
        "id": uuid.UUID("e0000001-0000-0000-0000-000000000004"),
        "name": "Cybersecurity Analyst",
        "description": "Protects organizational systems and data from threats.",
        "avg_salary_usd": 110000,
        "growth_outlook": "high",
    },
    "e0000001-0000-0000-0000-000000000005": {
        "id": uuid.UUID("e0000001-0000-0000-0000-000000000005"),
        "name": "Cloud Engineer",
        "description": "Designs, implements, and manages cloud infrastructure.",
        "avg_salary_usd": 130000,
        "growth_outlook": "high",
    },
    "e0000001-0000-0000-0000-000000000006": {
        "id": uuid.UUID("e0000001-0000-0000-0000-000000000006"),
        "name": "Full Stack Developer",
        "description": "Builds complete web applications from frontend to backend.",
        "avg_salary_usd": 115000,
        "growth_outlook": "high",
    },
}


# Career skill requirements with weights and target levels
CAREER_REQUIREMENTS: Dict[str, List[Dict]] = {
    "e0000001-0000-0000-0000-000000000001": [  # Software Engineer
        {"skill": "Python", "importance": "required", "weight": 0.15, "target": 4},
        {"skill": "Data Structures & Algorithms", "importance": "required", "weight": 0.18, "target": 4},
        {"skill": "System Design", "importance": "required", "weight": 0.15, "target": 3},
        {"skill": "Git", "importance": "required", "weight": 0.10, "target": 4},
        {"skill": "SQL", "importance": "important", "weight": 0.10, "target": 3},
        {"skill": "RESTful APIs", "importance": "important", "weight": 0.10, "target": 3},
        {"skill": "Docker", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "Testing & QA", "importance": "important", "weight": 0.07, "target": 3},
        {"skill": "Agile/Scrum", "importance": "optional", "weight": 0.04, "target": 2},
        {"skill": "Linux", "importance": "optional", "weight": 0.03, "target": 2},
    ],
    "e0000001-0000-0000-0000-000000000002": [  # ML Engineer
        {"skill": "Python", "importance": "required", "weight": 0.16, "target": 5},
        {"skill": "Machine Learning", "importance": "required", "weight": 0.18, "target": 4},
        {"skill": "Deep Learning", "importance": "required", "weight": 0.14, "target": 3},
        {"skill": "PyTorch", "importance": "required", "weight": 0.10, "target": 4},
        {"skill": "Docker", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "scikit-learn", "importance": "important", "weight": 0.07, "target": 3},
        {"skill": "SQL", "importance": "important", "weight": 0.06, "target": 3},
        {"skill": "RESTful APIs", "importance": "important", "weight": 0.06, "target": 3},
        {"skill": "Kubernetes", "importance": "optional", "weight": 0.05, "target": 2},
        {"skill": "AWS", "importance": "optional", "weight": 0.05, "target": 2},
        {"skill": "Natural Language Processing", "importance": "optional", "weight": 0.05, "target": 2},
    ],
    "e0000001-0000-0000-0000-000000000003": [  # Data Scientist
        {"skill": "Python", "importance": "required", "weight": 0.15, "target": 4},
        {"skill": "Statistical Analysis", "importance": "required", "weight": 0.18, "target": 4},
        {"skill": "Machine Learning", "importance": "required", "weight": 0.14, "target": 3},
        {"skill": "SQL", "importance": "required", "weight": 0.10, "target": 4},
        {"skill": "Pandas", "importance": "important", "weight": 0.09, "target": 4},
        {"skill": "Data Visualization", "importance": "important", "weight": 0.09, "target": 3},
        {"skill": "scikit-learn", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "R", "importance": "important", "weight": 0.06, "target": 3},
        {"skill": "Natural Language Processing", "importance": "optional", "weight": 0.05, "target": 2},
        {"skill": "Data Engineering", "importance": "optional", "weight": 0.06, "target": 2},
    ],
    "e0000001-0000-0000-0000-000000000004": [  # Cybersecurity Analyst
        {"skill": "Network Security", "importance": "required", "weight": 0.20, "target": 4},
        {"skill": "Linux", "importance": "required", "weight": 0.13, "target": 4},
        {"skill": "Python", "importance": "required", "weight": 0.10, "target": 3},
        {"skill": "SIEM Tools", "importance": "required", "weight": 0.13, "target": 3},
        {"skill": "Penetration Testing", "importance": "important", "weight": 0.11, "target": 3},
        {"skill": "Cryptography", "importance": "important", "weight": 0.09, "target": 3},
        {"skill": "Incident Response", "importance": "important", "weight": 0.09, "target": 3},
        {"skill": "Bash", "importance": "important", "weight": 0.06, "target": 3},
        {"skill": "AWS", "importance": "optional", "weight": 0.05, "target": 2},
        {"skill": "SQL", "importance": "optional", "weight": 0.04, "target": 2},
    ],
    "e0000001-0000-0000-0000-000000000005": [  # Cloud Engineer
        {"skill": "AWS", "importance": "required", "weight": 0.16, "target": 4},
        {"skill": "Docker", "importance": "required", "weight": 0.14, "target": 4},
        {"skill": "Kubernetes", "importance": "required", "weight": 0.13, "target": 3},
        {"skill": "Terraform", "importance": "required", "weight": 0.11, "target": 3},
        {"skill": "Linux", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "Python", "importance": "important", "weight": 0.07, "target": 3},
        {"skill": "DevOps", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "CI/CD", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "Cloud Architecture", "importance": "optional", "weight": 0.05, "target": 2},
        {"skill": "Bash", "importance": "optional", "weight": 0.05, "target": 3},
    ],
    "e0000001-0000-0000-0000-000000000006": [  # Full Stack Developer
        {"skill": "JavaScript", "importance": "required", "weight": 0.15, "target": 4},
        {"skill": "React", "importance": "required", "weight": 0.14, "target": 4},
        {"skill": "Node.js", "importance": "required", "weight": 0.12, "target": 4},
        {"skill": "SQL", "importance": "required", "weight": 0.10, "target": 3},
        {"skill": "TypeScript", "importance": "important", "weight": 0.09, "target": 3},
        {"skill": "RESTful APIs", "importance": "important", "weight": 0.09, "target": 3},
        {"skill": "Git", "importance": "important", "weight": 0.08, "target": 3},
        {"skill": "PostgreSQL", "importance": "important", "weight": 0.06, "target": 3},
        {"skill": "Docker", "importance": "optional", "weight": 0.05, "target": 2},
        {"skill": "Next.js", "importance": "optional", "weight": 0.06, "target": 2},
        {"skill": "MongoDB", "importance": "optional", "weight": 0.05, "target": 2},
    ],
}


def get_all_careers() -> List[CareerResponse]:
    """Return all career definitions."""
    return [CareerResponse(**c) for c in CAREERS.values()]


def get_career(career_id: str) -> Optional[CareerResponse]:
    """Get a single career by ID."""
    career_data = CAREERS.get(career_id)
    if career_data:
        return CareerResponse(**career_data)
    return None


def get_career_requirements(career_id: str) -> Optional[CareerRequirementsResponse]:
    """Get a career's skill requirements."""
    career = get_career(career_id)
    if not career:
        return None

    reqs = CAREER_REQUIREMENTS.get(career_id, [])
    requirements = [
        CareerRequirement(
            skill_name=r["skill"],
            importance=Importance(r["importance"]),
            weight=r["weight"],
            target_level=r["target"],
        )
        for r in reqs
    ]

    return CareerRequirementsResponse(career=career, requirements=requirements)


def compute_career_fit(
    profile: StudentProfileResponse,
    career_id: str,
) -> Optional[CareerFitResult]:
    """
    Compute how well a student fits a specific career.

    Uses the same scoring approach but reweighted by this career's skill_weights.
    The fit percentage is based on how well the student's current skills match
    the career's requirements.

    Returns fit percentage and evidence-grounded reasons.
    """
    career = get_career(career_id)
    if not career:
        return None

    requirements = CAREER_REQUIREMENTS.get(career_id, [])
    if not requirements:
        return None

    # Build student's skill map (name → proficiency)
    student_skills: Dict[str, int] = {}
    for skill in profile.skills:
        student_skills[skill.skill_name.lower()] = skill.proficiency

    total_weighted_score = 0.0
    total_weight = 0.0
    reasons: List[str] = []
    strengths = []
    gaps = []

    for req in requirements:
        skill_name = req["skill"]
        weight = req["weight"]
        target = req["target"]
        importance = req["importance"]

        student_level = student_skills.get(skill_name.lower(), 0)

        # Score for this skill: ratio of current to target (capped at 1.0)
        if target > 0:
            skill_score = min(student_level / target, 1.0)
        else:
            skill_score = 1.0

        total_weighted_score += skill_score * weight
        total_weight += weight

        # Collect evidence for reasons
        if student_level >= target:
            strengths.append(f"{skill_name} (level {student_level}/{target})")
        elif student_level > 0:
            gaps.append(f"{skill_name} ({importance}: {student_level}/{target})")
        else:
            gaps.append(f"{skill_name} ({importance}: not yet acquired)")

    # Compute fit percentage
    fit_pct = (total_weighted_score / total_weight * 100) if total_weight > 0 else 0
    fit_pct = round(min(fit_pct, 100), 1)

    # Build evidence-grounded reasons
    if strengths:
        reasons.append(f"Strong in: {', '.join(strengths[:3])}")
    if gaps:
        reasons.append(f"Gaps in: {', '.join(gaps[:3])}")

    # Add project relevance if applicable
    career_name_lower = career.name.lower()
    relevant_projects = []
    for proj in profile.projects:
        for tech in proj.technologies:
            if any(req["skill"].lower() in tech.lower() for req in requirements):
                relevant_projects.append(proj.title)
                break
    if relevant_projects:
        reasons.append(f"Relevant projects: {', '.join(relevant_projects[:2])}")

    return CareerFitResult(
        career=career,
        fit_percentage=fit_pct,
        reasons=reasons,
        match_rank=1,  # Will be set after ranking all careers
    )


async def compute_all_career_matches(
    profile: StudentProfileResponse,
) -> CareerMatchesResponse:
    """
    Compute fit percentages for ALL careers and return them ranked.

    Returns the best matches first, with evidence-grounded reasons
    tied to the student's actual data.
    """
    results = []

    for career_id in CAREERS:
        fit = compute_career_fit(profile, career_id)
        if fit:
            results.append(fit)

    # Sort by fit percentage (highest first)
    results.sort(key=lambda r: r.fit_percentage, reverse=True)

    # Assign ranks
    ranked_results = []
    for i, result in enumerate(results):
        ranked_results.append(CareerFitResult(
            career=result.career,
            fit_percentage=result.fit_percentage,
            reasons=result.reasons,
            match_rank=i + 1,
        ))

    logger.info(
        "career_matches_computed",
        student_id=str(profile.id),
        top_career=ranked_results[0].career.name if ranked_results else "none",
        top_fit=ranked_results[0].fit_percentage if ranked_results else 0,
    )

    return CareerMatchesResponse(
        student_id=profile.id,
        matches=ranked_results,
    )
