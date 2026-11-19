"""
CareerAI — Pydantic Schemas (API Contracts)

Every request/response shape is defined here as a strict Pydantic model.
These are the shared contracts between frontend and backend — no ad-hoc dicts.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


# =============================================================================
# Enums
# =============================================================================

class SkillCategory(str, Enum):
    LANGUAGE = "language"
    FRAMEWORK = "framework"
    TOOL = "tool"
    CONCEPT = "concept"
    SOFT_SKILL = "soft_skill"


class Importance(str, Enum):
    REQUIRED = "required"
    IMPORTANT = "important"
    OPTIONAL = "optional"


class GapClassification(str, Enum):
    CRITICAL = "critical"
    DEVELOPING = "developing"
    STRONG = "strong"


class SkillSource(str, Enum):
    EXTRACTED = "extracted"
    MANUAL = "manual"
    ASSESSED = "assessed"


class ExperienceType(str, Enum):
    INTERNSHIP = "internship"
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    FREELANCE = "freelance"
    RESEARCH = "research"
    VOLUNTEER = "volunteer"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


# =============================================================================
# Skill Schemas
# =============================================================================

class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: SkillCategory


class SkillResponse(SkillBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


class SkillEntryCreate(BaseModel):
    """A skill entry when creating/updating a student profile."""
    skill_name: str = Field(..., min_length=1, max_length=100, description="Skill name (will be canonicalized)")
    proficiency: int = Field(..., ge=1, le=5, description="1=Beginner to 5=Expert")
    evidence: Optional[str] = Field(None, max_length=1000, description="How this skill was demonstrated")
    source: SkillSource = SkillSource.EXTRACTED


class SkillEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    skill_name: str
    proficiency: int
    evidence: Optional[str] = None
    source: SkillSource


# =============================================================================
# Project Schemas
# =============================================================================

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = Field(None, max_length=2000)
    technologies: List[str] = Field(default_factory=list)
    url: Optional[str] = Field(None, max_length=500)
    highlights: List[str] = Field(default_factory=list)
    complexity: Optional[int] = Field(None, ge=1, le=5)

    @field_validator("technologies", "highlights")
    @classmethod
    def limit_list_length(cls, v: List[str]) -> List[str]:
        if len(v) > 20:
            raise ValueError("Maximum 20 items allowed")
        return v


class ProjectResponse(ProjectCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# =============================================================================
# Experience Schemas
# =============================================================================

class ExperienceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    company: Optional[str] = Field(None, max_length=200)
    duration_months: Optional[int] = Field(None, ge=0, le=600)
    description: Optional[str] = Field(None, max_length=2000)
    technologies: List[str] = Field(default_factory=list)
    experience_type: ExperienceType = ExperienceType.INTERNSHIP


class ExperienceResponse(ExperienceCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID


# =============================================================================
# Student Profile Schemas
# =============================================================================

class StudentProfileCreate(BaseModel):
    """Create a student profile from form input."""
    full_name: str = Field(..., min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    university: Optional[str] = Field(None, max_length=200)
    degree: Optional[str] = Field(None, max_length=200)
    graduation_year: Optional[int] = Field(None, ge=1990, le=2035)
    gpa: Optional[Decimal] = Field(None, ge=0, le=100)
    gpa_scale: Optional[Decimal] = Field(default=Decimal("10.0"), ge=1, le=100)
    skills: List[SkillEntryCreate] = Field(default_factory=list)
    projects: List[ProjectCreate] = Field(default_factory=list)
    experiences: List[ExperienceCreate] = Field(default_factory=list)

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        """Strip whitespace, collapse multiple spaces."""
        return " ".join(v.split())


class StudentProfileUpdate(BaseModel):
    """Partial update for student profile (all fields optional)."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    university: Optional[str] = Field(None, max_length=200)
    degree: Optional[str] = Field(None, max_length=200)
    graduation_year: Optional[int] = Field(None, ge=1990, le=2035)
    gpa: Optional[Decimal] = Field(None, ge=0, le=100)
    gpa_scale: Optional[Decimal] = Field(None, ge=1, le=100)
    skills: Optional[List[SkillEntryCreate]] = None
    projects: Optional[List[ProjectCreate]] = None
    experiences: Optional[List[ExperienceCreate]] = None
    profile_confirmed: Optional[bool] = None


class StudentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    full_name: str
    email: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    gpa_scale: Optional[float] = None
    profile_confirmed: bool = False
    skills: List[SkillEntryResponse] = Field(default_factory=list)
    projects: List[ProjectResponse] = Field(default_factory=list)
    experiences: List[ExperienceResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Score & Ranking Schemas
# =============================================================================

class ScoreBreakdown(BaseModel):
    """Transparent breakdown of the readiness score formula."""
    technical_skills: float = Field(..., description="0.25 weight")
    projects: float = Field(..., description="0.25 weight")
    academics: float = Field(..., description="0.20 weight")
    experience: float = Field(..., description="0.10 weight")
    assessments: float = Field(default=0.0, description="0.10 weight")
    achievements: float = Field(default=0.0, description="0.10 weight")


class RankingResponse(BaseModel):
    """Score, cohort ranking, and full breakdown."""
    student_id: uuid.UUID
    overall_score: float = Field(..., ge=0, le=100)
    percentile: float = Field(..., ge=0, le=100)
    cohort_rank: int = Field(..., ge=1)
    cohort_size: int = Field(..., ge=1)
    breakdown: ScoreBreakdown
    percentile_history: List[float] = Field(default_factory=list)
    computed_at: datetime


# =============================================================================
# Career Schemas
# =============================================================================

class CareerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str
    avg_salary_usd: Optional[int] = None
    growth_outlook: Optional[str] = None


class CareerRequirement(BaseModel):
    """A single skill requirement for a career."""
    skill_name: str
    importance: Importance
    weight: float
    target_level: int


class CareerRequirementsResponse(BaseModel):
    career: CareerResponse
    requirements: List[CareerRequirement]


class CareerFitResult(BaseModel):
    """How well a student fits a specific career."""
    career: CareerResponse
    fit_percentage: float = Field(..., ge=0, le=100)
    reasons: List[str] = Field(
        ...,
        description="Evidence-grounded reasons for fit score, tied to student's actual data"
    )
    match_rank: int = Field(..., ge=1)


class CareerMatchesResponse(BaseModel):
    student_id: uuid.UUID
    matches: List[CareerFitResult]


# =============================================================================
# Gap Analysis Schemas
# =============================================================================

class GapItem(BaseModel):
    skill_name: str
    importance: Importance
    current_level: int = Field(..., ge=0, le=5)
    target_level: int = Field(..., ge=1, le=5)
    gap_size: int = Field(..., ge=0, le=5)
    priority_score: float
    classification: GapClassification


class GapsResponse(BaseModel):
    student_id: uuid.UUID
    career_id: uuid.UUID
    career_name: str
    critical_gaps_count: int = 0
    developing_gaps_count: int = 0
    strong_skills_count: int = 0
    gaps: List[GapItem] = Field(default_factory=list)


# =============================================================================
# Roadmap Schemas
# =============================================================================

class RoadmapItem(BaseModel):
    """A concrete, single-action item addressing a specific gap."""
    id: uuid.UUID
    action_title: str
    action_detail: str
    priority_order: int
    phase: Optional[str] = "Core"
    estimated_hours: Optional[int] = None
    resource_url: Optional[str] = None
    gap_skill_name: Optional[str] = None  # which gap this addresses
    is_completed: bool = False
    completed_at: Optional[datetime] = None


class RoadmapResponse(BaseModel):
    student_id: uuid.UUID
    career_id: uuid.UUID
    career_name: str
    items: List[RoadmapItem]


# =============================================================================
# Coach Schemas
# =============================================================================

class CoachMessageCreate(BaseModel):
    """Student's message to the AI coach."""
    message: str = Field(..., min_length=1, max_length=2000)


class CoachMessageResponse(BaseModel):
    role: MessageRole
    content: str
    created_at: datetime


class CoachChatResponse(BaseModel):
    student_id: uuid.UUID
    reply: str
    history: List[CoachMessageResponse]


# =============================================================================
# Upload Schemas
# =============================================================================

class UploadResponse(BaseModel):
    """Response after successful resume upload and parsing."""
    student_id: uuid.UUID
    filename: str
    raw_text_preview: str = Field(
        ...,
        description="First 500 chars of extracted text for verification"
    )
    extracted_profile: StudentProfileResponse
    message: str = "Resume parsed successfully. Please review and confirm your profile."


class LinkedInImportRequest(BaseModel):
    """Request to import profile details from a LinkedIn profile URL."""
    linkedin_url: str = Field(
        ...,
        description="Public LinkedIn profile URL (e.g. https://www.linkedin.com/in/username)",
        pattern=r"^https?://([a-zA-Z0-9]+\.)?linkedin\.com/in/[a-zA-Z0-9_\-\%/]+/?$",
    )


# =============================================================================
# Progress / What-If Schemas
# =============================================================================

class RecalculateRequest(BaseModel):
    """Mark roadmap items as completed and recalculate."""
    completed_item_ids: List[uuid.UUID] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="IDs of roadmap items to mark as completed"
    )


class RecalculateResponse(BaseModel):
    student_id: uuid.UUID
    previous_score: float
    new_score: float
    score_change: float
    new_breakdown: ScoreBreakdown
    message: str = "Score recalculated based on completed roadmap items."


# =============================================================================
# Health Check
# =============================================================================

class HealthResponse(BaseModel):
    status: str = "healthy"
    database: bool
    version: str = "1.0.0"


# =============================================================================
# Error Responses
# =============================================================================

class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: str
    detail: Optional[str] = None
    status_code: int
