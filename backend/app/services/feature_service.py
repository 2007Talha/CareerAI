"""
CareerAI — Feature Service

Converts raw student profile data into numeric feature vectors
for the scoring formula. This is the bridge between Pydantic models
and the ML scoring engine.
"""

from typing import Dict, List, Optional

from app.models.schemas import StudentProfileResponse


def profile_to_features(profile: StudentProfileResponse) -> Dict:
    """
    Convert a StudentProfileResponse into the feature dict format
    expected by ml/src/scoring.py.

    Returns a dict with all the inputs the scoring formula needs.
    """
    # Skills → list of dicts with proficiency and category
    skills = [
        {
            "proficiency": s.proficiency,
            "category": _infer_skill_category(s.skill_name),
        }
        for s in profile.skills
    ]

    # Projects → list of dicts with complexity, technologies, highlights
    projects = [
        {
            "complexity": p.complexity,
            "technologies": p.technologies,
            "highlights": p.highlights,
        }
        for p in profile.projects
    ]

    # Experiences → list of dicts with duration_months, experience_type
    experiences = [
        {
            "duration_months": e.duration_months,
            "experience_type": e.experience_type.value if e.experience_type else "internship",
        }
        for e in profile.experiences
    ]

    # Auto-detect achievements from projects & experience (hackathons, competitions, awards)
    achievements = []
    achievement_keywords = [
        "hackathon", "winner", "award", "competition", "ideathon",
        "1st place", "first place", "runner up", "finalist", "fellowship",
        "scholarship", "patent", "published", "paper", "smart india",
    ]
    for p in profile.projects:
        text_block = f"{p.title} {p.description or ''} {' '.join(p.highlights or [])}".lower()
        for kw in achievement_keywords:
            if kw in text_block:
                achievements.append(f"{p.title}: {kw}")
                break

    # Auto-detect certifications / assessments from skill evidence and project descriptions
    assessments = []
    cert_keywords = ["certified", "certification", "credential", "license", "exam", "assessment", "pbel", "badge"]
    for s in profile.skills:
        evidence_lower = (s.evidence or "").lower()
        if s.source == "assessed" or any(ck in evidence_lower for ck in cert_keywords):
            assessments.append({"name": s.skill_name, "evidence": s.evidence})

    return {
        "skills": skills,
        "projects": projects,
        "experiences": experiences,
        "gpa": profile.gpa,
        "gpa_scale": profile.gpa_scale,
        "degree": profile.degree,
        "assessments": assessments if assessments else None,
        "achievements": achievements if achievements else None,
    }


# Skill category inference from name (used when category isn't stored)
_CATEGORY_MAP = {
    # Languages
    "python": "language", "javascript": "language", "typescript": "language",
    "java": "language", "c++": "language", "go": "language", "rust": "language",
    "sql": "language", "r": "language", "bash": "language",
    # Frameworks
    "react": "framework", "node.js": "framework", "django": "framework",
    "flask": "framework", "fastapi": "framework", "spring boot": "framework",
    "tensorflow": "framework", "pytorch": "framework", "scikit-learn": "framework",
    "express.js": "framework", "next.js": "framework", "pandas": "framework",
    "numpy": "framework",
    # Tools
    "docker": "tool", "kubernetes": "tool", "aws": "tool", "gcp": "tool",
    "azure": "tool", "git": "tool", "postgresql": "tool", "mongodb": "tool",
    "redis": "tool", "linux": "tool", "terraform": "tool", "jenkins": "tool",
    "ci/cd": "tool",
    # Concepts
    "machine learning": "concept", "deep learning": "concept",
    "natural language processing": "concept", "computer vision": "concept",
    "data structures & algorithms": "concept", "system design": "concept",
    "restful apis": "concept", "microservices": "concept",
    "network security": "concept", "penetration testing": "concept",
    "cryptography": "concept", "cloud architecture": "concept",
    "devops": "concept", "data engineering": "concept",
    "statistical analysis": "concept", "agile/scrum": "concept",
    "testing & qa": "concept", "siem tools": "concept",
    "incident response": "concept", "data visualization": "concept",
}


def _infer_skill_category(skill_name: str) -> str:
    """Infer skill category from name. Defaults to 'concept' if unknown."""
    return _CATEGORY_MAP.get(skill_name.lower(), "concept")
