"""
CareerAI — Scoring Engine

Transparent, deterministic weighted scoring formula.
This is the core "intelligence" — scikit-learn normalizes, but the formula is hand-designed.

Formula:
    readiness_score =
        0.25 × technical_skills
      + 0.25 × projects
      + 0.20 × academics
      + 0.10 × experience
      + 0.10 × assessments
      + 0.10 × achievements

This is a designed heuristic, not a trained model. It is reproducible,
explainable, and deterministic across repeated runs.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional


# =============================================================================
# Scoring Weights — the single source of truth
# =============================================================================

WEIGHTS = {
    "technical_skills": 0.25,
    "projects": 0.25,
    "academics": 0.20,
    "experience": 0.10,
    "assessments": 0.10,
    "achievements": 0.10,
}


@dataclass(frozen=True)
class ScoreResult:
    """Immutable result of the scoring formula."""
    overall_score: float
    technical_skills: float
    projects: float
    academics: float
    experience: float
    assessments: float
    achievements: float

    @property
    def breakdown(self) -> Dict[str, float]:
        return {
            "technical_skills": round(self.technical_skills, 2),
            "projects": round(self.projects, 2),
            "academics": round(self.academics, 2),
            "experience": round(self.experience, 2),
            "assessments": round(self.assessments, 2),
            "achievements": round(self.achievements, 2),
        }


def compute_technical_score(skills: List[Dict]) -> float:
    """
    Score technical skills on a 0–100 scale.

    Based on:
    - Number of skills (breadth, capped at 15)
    - Average proficiency across skills (depth)
    - Presence of skills in different categories (diversity bonus)

    Each component normalized to 0–100.
    """
    if not skills:
        return 0.0

    # Average proficiency (1-5 scale → 0-100)
    avg_proficiency = sum(s.get("proficiency", 1) for s in skills) / len(skills)
    proficiency_score = (avg_proficiency / 5.0) * 100.0

    # Breadth: number of skills (capped at 15 for diminishing returns)
    breadth = min(len(skills), 15)
    breadth_score = (breadth / 15.0) * 100.0

    # Category diversity bonus (0-20 points)
    categories = set()
    for s in skills:
        cat = s.get("category", "")
        if cat:
            categories.add(cat)
    diversity_bonus = min(len(categories) * 5, 20)

    # Weighted combination
    score = (proficiency_score * 0.50) + (breadth_score * 0.35) + (diversity_bonus * 0.75)
    return min(round(score, 2), 100.0)


def compute_projects_score(projects: List[Dict]) -> float:
    """
    Score project portfolio on a 0–100 scale.

    Based on:
    - Number of projects (capped at 8)
    - Average complexity (1-5 scale)
    - Technology diversity across projects
    """
    if not projects:
        return 0.0

    # Quantity (capped at 8)
    quantity = min(len(projects), 8)
    quantity_score = (quantity / 8.0) * 100.0

    # Average complexity
    complexities = [p.get("complexity", 2) or 2 for p in projects]
    avg_complexity = sum(complexities) / len(complexities)
    complexity_score = (avg_complexity / 5.0) * 100.0

    # Technology diversity across all projects
    all_techs = set()
    for p in projects:
        for tech in p.get("technologies", []):
            all_techs.add(tech.lower())
    tech_diversity = min(len(all_techs), 15)
    diversity_score = (tech_diversity / 15.0) * 100.0

    # Highlight bonus (projects with documented outcomes are more impressive)
    highlight_count = sum(
        len(p.get("highlights", [])) for p in projects
    )
    highlight_score = min(highlight_count * 5, 20)

    score = (
        quantity_score * 0.25
        + complexity_score * 0.35
        + diversity_score * 0.25
        + highlight_score * 0.75
    )
    return min(round(score, 2), 100.0)


def compute_academics_score(
    gpa: Optional[float],
    gpa_scale: Optional[float],
    degree: Optional[str],
) -> float:
    """
    Score academics on a 0–100 scale.

    Accurately normalizes:
    - 4.0 scale (US GPA)
    - 10.0 scale (CGPA standard in India and Europe)
    - 100% scale (Percentage grades)
    """
    score = 0.0

    if gpa is not None:
        scale = gpa_scale if (gpa_scale is not None and gpa_scale > 0) else (10.0 if gpa > 4.0 else 4.0)

        # Normalize to 4.0 scale
        if scale >= 50.0 or gpa > 10.0:
            # Percentage scale (e.g. 85% -> 3.4/4.0)
            normalized_gpa = (gpa / scale) * 4.0
        elif scale >= 8.0 or gpa > 4.0:
            # 10.0 CGPA scale (e.g. 8.5/10.0 -> 3.4/4.0)
            normalized_gpa = (gpa / scale) * 4.0
        else:
            # 4.0 GPA scale
            normalized_gpa = (gpa / scale) * 4.0

        normalized_gpa = min(max(normalized_gpa, 0.0), 4.0)

        # Map 0-4.0 → 0-100 with realistic academic distribution curve
        if normalized_gpa >= 3.5:
            score = 80.0 + (normalized_gpa - 3.5) * 40.0  # 3.5-4.0 → 80-100
        elif normalized_gpa >= 3.0:
            score = 65.0 + (normalized_gpa - 3.0) * 30.0  # 3.0-3.5 → 65-80
        elif normalized_gpa >= 2.5:
            score = 45.0 + (normalized_gpa - 2.5) * 40.0  # 2.5-3.0 → 45-65
        else:
            score = max((normalized_gpa / 2.5) * 45.0, 0.0)  # 0-2.5 → 0-45
    else:
        # No GPA provided — neutral benchmark rather than heavy penalty
        score = 60.0

    # Degree relevance bonus
    if degree:
        degree_lower = degree.lower()
        cs_keywords = [
            "computer", "software", "information technology",
            "data science", "artificial intelligence", "cybersecurity",
            "information systems", "computing", "electronics", "engineering",
        ]
        if any(kw in degree_lower for kw in cs_keywords):
            score = min(score + 8.0, 100.0)

    return min(round(score, 2), 100.0)


def compute_experience_score(experiences: List[Dict]) -> float:
    """
    Score work/internship experience on a 0–100 scale.

    Based on:
    - Total months of experience (scaled appropriately for student/entry-level)
    - Number of distinct positions
    - Type of experience (full-time > internship > volunteer)
    """
    if not experiences:
        return 0.0

    # Total months (capped at 36 for college/entry-level assessment)
    total_months = sum(e.get("duration_months", 0) or 0 for e in experiences)
    months_capped = min(total_months, 36)
    months_score = (months_capped / 36.0) * 100.0

    # Position count bonus
    position_score = min(len(experiences) * 15, 40)

    # Experience type weights
    type_weights = {
        "full_time": 1.0,
        "part_time": 0.75,
        "internship": 0.75,
        "research": 0.70,
        "freelance": 0.65,
        "volunteer": 0.40,
    }
    type_scores = [
        type_weights.get(e.get("experience_type", "internship"), 0.6)
        for e in experiences
    ]
    avg_type_weight = sum(type_scores) / len(type_scores) if type_scores else 0.6
    type_bonus = avg_type_weight * 30

    score = (months_score * 0.45) + position_score + (type_bonus * 0.55)
    return min(round(score, 2), 100.0)


def compute_assessments_score(assessments: Optional[List[Dict]] = None) -> float:
    """
    Score assessments/certifications on a 0–100 scale.
    """
    if not assessments:
        return 0.0

    count = min(len(assessments), 6)
    return min(round((count / 6.0) * 100.0, 2), 100.0)


def compute_achievements_score(achievements: Optional[List[str]] = None) -> float:
    """
    Score achievements (hackathons, awards, competitions, publications) on a 0–100 scale.
    """
    if not achievements:
        return 0.0

    count = min(len(achievements), 5)
    return min(round((count / 5.0) * 100.0, 2), 100.0)


def compute_readiness_score(
    skills: List[Dict],
    projects: List[Dict],
    experiences: List[Dict],
    gpa: Optional[float] = None,
    gpa_scale: Optional[float] = None,
    degree: Optional[str] = None,
    assessments: Optional[List[Dict]] = None,
    achievements: Optional[List[str]] = None,
) -> ScoreResult:
    """
    Compute the overall career readiness score using an adaptive, transparent formula.

    - If assessments & achievements are present, distributes across all 6 dimensions.
    - If assessments or achievements are not recorded, scales base dimensions so
      candidates are not unfairly penalized with a 20-point deficit.

    DETERMINISTIC function — same profile always yields same score.
    """
    technical = compute_technical_score(skills)
    proj_score = compute_projects_score(projects)
    acad_score = compute_academics_score(gpa, gpa_scale, degree)
    exp_score = compute_experience_score(experiences)
    assess_score = compute_assessments_score(assessments)
    achieve_score = compute_achievements_score(achievements)

    has_assess = (assess_score > 0)
    has_achieve = (achieve_score > 0)

    if has_assess and has_achieve:
        w_tech, w_proj, w_acad, w_exp, w_assess, w_achieve = 0.25, 0.25, 0.20, 0.10, 0.10, 0.10
    elif has_assess:
        w_tech, w_proj, w_acad, w_exp, w_assess, w_achieve = 0.27, 0.27, 0.23, 0.13, 0.10, 0.0
    elif has_achieve:
        w_tech, w_proj, w_acad, w_exp, w_assess, w_achieve = 0.27, 0.27, 0.23, 0.13, 0.0, 0.10
    else:
        # Balanced 4-pillar model summing to 100%
        w_tech, w_proj, w_acad, w_exp, w_assess, w_achieve = 0.30, 0.30, 0.25, 0.15, 0.0, 0.0

    overall = (
        w_tech * technical
        + w_proj * proj_score
        + w_acad * acad_score
        + w_exp * exp_score
        + w_assess * assess_score
        + w_achieve * achieve_score
    )

    overall = min(max(round(overall, 2), 0.0), 100.0)

    return ScoreResult(
        overall_score=overall,
        technical_skills=technical,
        projects=proj_score,
        academics=acad_score,
        experience=exp_score,
        assessments=assess_score,
        achievements=achieve_score,
    )
