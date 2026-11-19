-- =============================================================================
-- CareerAI Database Schema
-- PostgreSQL 16 + pgvector
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- CANONICAL SKILLS — single source of truth for skill names
-- =============================================================================
CREATE TABLE skills (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    VARCHAR(50) NOT NULL,  -- 'language', 'framework', 'tool', 'concept', 'soft_skill'
    aliases     TEXT[] DEFAULT '{}',   -- e.g. {'JS', 'Javascript'} all map to 'JavaScript'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_name ON skills(name);

-- =============================================================================
-- STUDENTS — core student profile
-- =============================================================================
CREATE TABLE students (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(254) UNIQUE,
    university      VARCHAR(200),
    degree          VARCHAR(200),
    graduation_year INTEGER,
    gpa             DECIMAL(4, 2),
    gpa_scale       DECIMAL(4, 2) DEFAULT 4.0,
    raw_resume_text TEXT,               -- original extracted text
    resume_filename VARCHAR(255),
    profile_confirmed BOOLEAN DEFAULT FALSE,  -- student verified extraction
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_email ON students(email);

-- =============================================================================
-- STUDENT SKILLS — student's skill inventory with proficiency levels
-- =============================================================================
CREATE TABLE student_skills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency     INTEGER NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
        -- 1=Beginner, 2=Elementary, 3=Intermediate, 4=Advanced, 5=Expert
    evidence        TEXT,           -- how the skill was demonstrated
    source          VARCHAR(20) NOT NULL DEFAULT 'extracted',
        -- 'extracted' (from resume), 'manual' (student-entered), 'assessed'
    embedding       vector(768),    -- pgvector embedding for semantic matching
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, skill_id)
);

CREATE INDEX idx_student_skills_student ON student_skills(student_id);
CREATE INDEX idx_student_skills_skill ON student_skills(skill_id);

-- =============================================================================
-- PROJECTS — student project portfolio
-- =============================================================================
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    technologies    TEXT[] DEFAULT '{}',
    url             VARCHAR(500),
    highlights      TEXT[] DEFAULT '{}',     -- key achievements/outcomes
    complexity      INTEGER CHECK (complexity BETWEEN 1 AND 5),
        -- 1=Tutorial-level, 2=Simple, 3=Moderate, 4=Complex, 5=Production-grade
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_student ON projects(student_id);

-- =============================================================================
-- EXPERIENCES — work/internship experience
-- =============================================================================
CREATE TABLE experiences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title           VARCHAR(300) NOT NULL,
    company         VARCHAR(200),
    duration_months INTEGER,
    description     TEXT,
    technologies    TEXT[] DEFAULT '{}',
    experience_type VARCHAR(30) NOT NULL DEFAULT 'internship',
        -- 'internship', 'full_time', 'part_time', 'freelance', 'research', 'volunteer'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experiences_student ON experiences(student_id);

-- =============================================================================
-- CAREERS — target career definitions
-- =============================================================================
CREATE TABLE careers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    avg_salary_usd  INTEGER,
    growth_outlook  VARCHAR(50),    -- 'high', 'moderate', 'stable'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CAREER SKILLS — what each career requires (the ground truth for scoring)
-- =============================================================================
CREATE TABLE career_skills (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    career_id       UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    importance      VARCHAR(20) NOT NULL CHECK (importance IN ('required', 'important', 'optional')),
    weight          DECIMAL(4, 3) NOT NULL CHECK (weight BETWEEN 0 AND 1),
        -- how much this skill matters for this career (used in career-specific scoring)
    target_level    INTEGER NOT NULL CHECK (target_level BETWEEN 1 AND 5),
        -- minimum proficiency expected for this career
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(career_id, skill_id)
);

CREATE INDEX idx_career_skills_career ON career_skills(career_id);

-- =============================================================================
-- STUDENT SCORES — computed readiness scores with full breakdown
-- =============================================================================
CREATE TABLE student_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    career_id           UUID REFERENCES careers(id) ON DELETE SET NULL,
        -- NULL = overall score; non-NULL = career-specific fit score
    overall_score       DECIMAL(5, 2) NOT NULL,
    technical_score     DECIMAL(5, 2) NOT NULL,
    projects_score      DECIMAL(5, 2) NOT NULL,
    academics_score     DECIMAL(5, 2) NOT NULL,
    experience_score    DECIMAL(5, 2) NOT NULL,
    assessments_score   DECIMAL(5, 2) NOT NULL DEFAULT 0,
    achievements_score  DECIMAL(5, 2) NOT NULL DEFAULT 0,
    percentile          DECIMAL(5, 2),
    cohort_rank         INTEGER,
    cohort_size         INTEGER,
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scores_student ON student_scores(student_id);
CREATE INDEX idx_scores_career ON student_scores(career_id);
CREATE UNIQUE INDEX idx_scores_student_career ON student_scores(student_id, career_id)
    WHERE career_id IS NOT NULL;

-- =============================================================================
-- SKILL GAPS — identified gaps between current and target proficiency
-- =============================================================================
CREATE TABLE skill_gaps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    career_id       UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    current_level   INTEGER NOT NULL CHECK (current_level BETWEEN 0 AND 5),
        -- 0 means skill not present at all
    target_level    INTEGER NOT NULL CHECK (target_level BETWEEN 1 AND 5),
    gap_size        INTEGER GENERATED ALWAYS AS (target_level - current_level) STORED,
    importance      VARCHAR(20) NOT NULL,
    priority_score  DECIMAL(5, 2) NOT NULL,
        -- importance_weight × gap_size — higher = more urgent
    classification  VARCHAR(20) NOT NULL CHECK (classification IN ('critical', 'developing', 'strong')),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, career_id, skill_id)
);

CREATE INDEX idx_gaps_student_career ON skill_gaps(student_id, career_id);

-- =============================================================================
-- ROADMAPS — personalized action items derived from gaps
-- =============================================================================
CREATE TABLE roadmaps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    career_id       UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    gap_id          UUID REFERENCES skill_gaps(id) ON DELETE SET NULL,
        -- traces back to the specific gap this action addresses
    action_title    VARCHAR(300) NOT NULL,
    action_detail   TEXT NOT NULL,
    priority_order  INTEGER NOT NULL,
    estimated_hours INTEGER,
    resource_url    VARCHAR(500),
    is_completed    BOOLEAN DEFAULT FALSE,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roadmaps_student_career ON roadmaps(student_id, career_id);

-- =============================================================================
-- COACH MESSAGES — conversation history with AI coach
-- =============================================================================
CREATE TABLE coach_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role            VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    context_snapshot JSONB,     -- snapshot of profile/score/gaps at time of message
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coach_student ON coach_messages(student_id);
CREATE INDEX idx_coach_created ON coach_messages(created_at);

-- =============================================================================
-- UPDATED_AT trigger — auto-update timestamp on row changes
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
