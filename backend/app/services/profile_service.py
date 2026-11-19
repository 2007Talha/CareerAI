"""
CareerAI — Profile Service

Manages student profile lifecycle:
- Creation from form input or Gemini extraction
- Skill name canonicalization
- Profile retrieval and updates
- Profile confirmation workflow
"""

import uuid
from typing import Dict, List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
    SkillEntryCreate,
    SkillEntryResponse,
    ProjectCreate,
    ProjectResponse,
    ExperienceCreate,
    ExperienceResponse,
)
from app.utils.logging import get_logger

logger = get_logger(__name__)


# =============================================================================
# Skill Name Canonicalization
# =============================================================================

# In-memory canonical skill map (loaded from DB at startup, or use this default)
# Maps common aliases → canonical names
SKILL_ALIASES: Dict[str, str] = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python3": "Python",
    "cpp": "C++",
    "c++": "C++",
    "golang": "Go",
    "sql": "SQL",
    "r-lang": "R",
    "r language": "R",
    "shell": "Bash",
    "sh": "Bash",
    "reactjs": "React",
    "react.js": "React",
    "nodejs": "Node.js",
    "node": "Node.js",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "springboot": "Spring Boot",
    "spring-boot": "Spring Boot",
    "spring boot": "Spring Boot",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",
    "express": "Express.js",
    "expressjs": "Express.js",
    "nextjs": "Next.js",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "k8s": "Kubernetes",
    "amazon web services": "AWS",
    "aws": "AWS",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "gcp": "GCP",
    "microsoft azure": "Azure",
    "github": "Git",
    "gitlab": "Git",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "neural networks": "Deep Learning",
    "nlp": "Natural Language Processing",
    "text mining": "Natural Language Processing",
    "cv": "Computer Vision",
    "image recognition": "Computer Vision",
    "dsa": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "system design": "System Design",
    "systems design": "System Design",
    "rest": "RESTful APIs",
    "rest apis": "RESTful APIs",
    "api design": "RESTful APIs",
    "microservices": "Microservices",
    "micro-services": "Microservices",
    "network security": "Network Security",
    "pentesting": "Penetration Testing",
    "pen testing": "Penetration Testing",
    "ethical hacking": "Penetration Testing",
    "crypto": "Cryptography",
    "encryption": "Cryptography",
    "cloud architecture": "Cloud Architecture",
    "devops": "DevOps",
    "dev ops": "DevOps",
    "etl": "Data Engineering",
    "data pipelines": "Data Engineering",
    "data engineering": "Data Engineering",
    "statistics": "Statistical Analysis",
    "stats": "Statistical Analysis",
    "statistical analysis": "Statistical Analysis",
    "agile": "Agile/Scrum",
    "scrum": "Agile/Scrum",
    "kanban": "Agile/Scrum",
    "testing": "Testing & QA",
    "unit testing": "Testing & QA",
    "qa": "Testing & QA",
    "test automation": "Testing & QA",
    "siem": "SIEM Tools",
    "splunk": "SIEM Tools",
    "security monitoring": "SIEM Tools",
    "incident response": "Incident Response",
    "ir": "Incident Response",
    "data viz": "Data Visualization",
    "visualization": "Data Visualization",
    "dashboards": "Data Visualization",
    "cicd": "CI/CD",
    "ci cd": "CI/CD",
    "continuous integration": "CI/CD",
    "continuous deployment": "CI/CD",
    "docker": "Docker",
    "containers": "Docker",
    "terraform": "Terraform",
    "jenkins": "Jenkins",
    "redis": "Redis",
    "linux": "Linux",
    "ubuntu": "Linux",
    "centos": "Linux",
    "debian": "Linux",
}


def canonicalize_skill_name(name: str) -> str:
    """
    Normalize a skill name to its canonical form.
    Tries case-insensitive lookup in the alias map.
    Falls back to the original name (title-cased) if no match.
    """
    normalized = name.strip().lower()
    if normalized in SKILL_ALIASES:
        return SKILL_ALIASES[normalized]
    # If no alias found, return as-is (preserving original casing)
    return name.strip()


def canonicalize_skills(skills: List[SkillEntryCreate]) -> List[SkillEntryCreate]:
    """Canonicalize all skill names in a list, deduplicating by canonical name."""
    seen = {}
    result = []

    for skill in skills:
        canonical = canonicalize_skill_name(skill.skill_name)
        if canonical.lower() not in seen:
            seen[canonical.lower()] = True
            result.append(SkillEntryCreate(
                skill_name=canonical,
                proficiency=skill.proficiency,
                evidence=skill.evidence,
                source=skill.source,
            ))
        else:
            # Duplicate — keep the higher proficiency
            for existing in result:
                if existing.skill_name.lower() == canonical.lower():
                    if skill.proficiency > existing.proficiency:
                        existing.proficiency = skill.proficiency
                        if skill.evidence:
                            existing.evidence = skill.evidence
                    break

    return result


# =============================================================================
# Profile CRUD Operations
# =============================================================================

# In-memory store for demo (replace with DB queries in production)
_profiles_store: Dict[str, dict] = {}


async def create_profile(
    db: AsyncSession,
    profile_data: StudentProfileCreate,
) -> StudentProfileResponse:
    """
    Create a new student profile.

    1. Canonicalize skill names
    2. Store student record
    3. Store skills, projects, experiences
    4. Return complete profile response
    """
    # Canonicalize skills
    canonical_skills = canonicalize_skills(profile_data.skills)

    profile_id = uuid.uuid4()
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)

    # Build response (using in-memory store for initial scaffold)
    profile = {
        "id": profile_id,
        "full_name": profile_data.full_name,
        "email": str(profile_data.email) if profile_data.email else None,
        "university": profile_data.university,
        "degree": profile_data.degree,
        "graduation_year": profile_data.graduation_year,
        "gpa": float(profile_data.gpa) if profile_data.gpa else None,
        "gpa_scale": float(profile_data.gpa_scale) if profile_data.gpa_scale else 10.0,
        "profile_confirmed": False,
        "skills": [
            {
                "id": uuid.uuid4(),
                "skill_name": s.skill_name,
                "proficiency": s.proficiency,
                "evidence": s.evidence,
                "source": s.source,
            }
            for s in canonical_skills
        ],
        "projects": [
            {
                "id": uuid.uuid4(),
                **p.model_dump(),
            }
            for p in profile_data.projects
        ],
        "experiences": [
            {
                "id": uuid.uuid4(),
                **e.model_dump(),
            }
            for e in profile_data.experiences
        ],
        "created_at": now,
        "updated_at": now,
    }

    _profiles_store[str(profile_id)] = profile

    logger.info(
        "profile_created",
        profile_id=str(profile_id),
        name=profile_data.full_name,
        skills=len(canonical_skills),
        projects=len(profile_data.projects),
        experiences=len(profile_data.experiences),
    )

    return StudentProfileResponse(**profile)


async def get_profile(
    db: AsyncSession,
    profile_id: uuid.UUID,
) -> Optional[StudentProfileResponse]:
    """Retrieve a student profile by ID, checking memory store first and falling back to DB."""
    profile_data = _profiles_store.get(str(profile_id))
    if profile_data is not None:
        return StudentProfileResponse(**profile_data)

    # Fetch from database
    try:
        from sqlalchemy import text
        res = await db.execute(
            text(
                "SELECT id, full_name, email, university, degree, graduation_year, "
                "gpa, gpa_scale, profile_confirmed, created_at, updated_at "
                "FROM students WHERE id = :id"
            ),
            {"id": str(profile_id)},
        )
        row = res.mappings().first()
        if not row:
            return None

        # Fetch skills
        skills_res = await db.execute(
            text(
                "SELECT sk.name as skill_name, ss.proficiency, ss.evidence, ss.source, ss.id "
                "FROM student_skills ss "
                "JOIN skills sk ON ss.skill_id = sk.id "
                "WHERE ss.student_id = :id"
            ),
            {"id": str(profile_id)},
        )
        skills = [
            SkillEntryResponse(
                id=s["id"],
                skill_name=s["skill_name"],
                proficiency=s["proficiency"],
                evidence=s["evidence"],
                source=s["source"],
            )
            for s in skills_res.mappings().all()
        ]

        # Fetch projects
        proj_res = await db.execute(
            text(
                "SELECT id, title, description, technologies, complexity "
                "FROM projects WHERE student_id = :id"
            ),
            {"id": str(profile_id)},
        )
        projects = [
            ProjectResponse(
                id=p["id"],
                title=p["title"],
                description=p["description"],
                technologies=p["technologies"] or [],
                complexity=p["complexity"],
            )
            for p in proj_res.mappings().all()
        ]

        # Fetch experiences
        exp_res = await db.execute(
            text(
                "SELECT id, title, company, duration_months, experience_type "
                "FROM experiences WHERE student_id = :id"
            ),
            {"id": str(profile_id)},
        )
        experiences = [
            ExperienceResponse(
                id=e["id"],
                title=e["title"],
                company=e["company"],
                duration_months=e["duration_months"],
                experience_type=e["experience_type"],
            )
            for e in exp_res.mappings().all()
        ]

        return StudentProfileResponse(
            id=row["id"],
            full_name=row["full_name"],
            email=row["email"],
            university=row["university"],
            degree=row["degree"],
            graduation_year=row["graduation_year"],
            gpa=float(row["gpa"]) if row["gpa"] is not None else None,
            gpa_scale=float(row["gpa_scale"]) if row["gpa_scale"] is not None else 10.0,
            profile_confirmed=row["profile_confirmed"],
            skills=skills,
            projects=projects,
            experiences=experiences,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
    except Exception as exc:
        logger.warning("get_profile_db_failed", profile_id=str(profile_id), error=str(exc))
        return None


async def update_profile(
    db: AsyncSession,
    profile_id: uuid.UUID,
    update_data: StudentProfileUpdate,
) -> Optional[StudentProfileResponse]:
    """Update an existing student profile."""
    profile = _profiles_store.get(str(profile_id))
    if profile is None:
        return None

    # Apply updates
    update_dict = update_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        if key == "skills" and value is not None:
            canonical_skills = canonicalize_skills(value)
            profile["skills"] = [
                {
                    "id": uuid.uuid4(),
                    "skill_name": s.skill_name,
                    "proficiency": s.proficiency,
                    "evidence": s.evidence,
                    "source": s.source,
                }
                for s in canonical_skills
            ]
        elif key == "projects" and value is not None:
            profile["projects"] = [
                {"id": uuid.uuid4(), **p.model_dump()}
                for p in value
            ]
        elif key == "experiences" and value is not None:
            profile["experiences"] = [
                {"id": uuid.uuid4(), **e.model_dump()}
                for e in value
            ]
        elif value is not None:
            profile[key] = value

    profile["updated_at"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    )

    logger.info("profile_updated", profile_id=str(profile_id))
    return StudentProfileResponse(**profile)


async def list_profiles(db: AsyncSession) -> List[StudentProfileResponse]:
    """List all student profiles (for cohort operations)."""
    return [StudentProfileResponse(**p) for p in _profiles_store.values()]
