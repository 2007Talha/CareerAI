"""
CareerAI — Gemini AI Service

Wrapper around Google Gemini API for:
1. Structured profile extraction from resume text
2. Career coaching conversations
3. Embedding generation for semantic matching

Includes retry logic, Pydantic validation, and graceful degradation.
"""

import asyncio
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Dict, Optional

import google.generativeai as genai
from pydantic import ValidationError

from app.config import get_settings
from app.models.schemas import (
    StudentProfileCreate,
    SkillEntryCreate,
    ProjectCreate,
    ExperienceCreate,
    ExperienceType,
)
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Configure Gemini API
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

# Prompt templates directory
PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "prompts"


class GeminiServiceError(Exception):
    """Raised when Gemini API interaction fails."""
    pass


def _load_prompt(template_name: str) -> str:
    """Load a prompt template from the prompts directory."""
    prompt_path = PROMPTS_DIR / template_name
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt template not found: {prompt_path}")
    return prompt_path.read_text(encoding="utf-8")


def _clean_json_response(text: str) -> str:
    """
    Clean Gemini's response to extract valid JSON.
    Handles common issues:
    - Markdown code fences (```json ... ```)
    - Leading/trailing whitespace
    - Trailing commas (common Gemini quirk)
    """
    # Remove markdown code fences
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text)
    text = text.strip()

    # Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)

    return text


def _get_model(
    model_name: Optional[str] = None,
    temperature: float = 0.1,
    max_output_tokens: int = 4096,
) -> genai.GenerativeModel:
    """Get a configured Gemini model instance (defaults to gemini-3.8-flash)."""
    chosen = model_name or settings.gemini_model or "gemini-3.8-flash"
    return genai.GenerativeModel(
        model_name=chosen,
        generation_config=genai.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        ),
    )


def _generate_with_fallback(
    model: genai.GenerativeModel,
    prompt: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
    timeout_seconds: float = 6.0,
):
    """Execute generate_content with gemini-3.8-flash, enforcing a strict network deadline."""
    try:
        return model.generate_content(prompt, request_options={"timeout": timeout_seconds})
    except Exception as exc:
        err_msg = str(exc).lower()
        if "not found" in err_msg or "no longer available" in err_msg or "404" in err_msg:
            logger.warning("gemini_model_fallback_triggered", original_model=getattr(model, "model_name", None), error=str(exc))
            fallback = _get_model("gemini-3.6-flash", temperature=temperature, max_output_tokens=max_tokens)
            return fallback.generate_content(prompt, request_options={"timeout": timeout_seconds})
        raise


def _fallback_heuristic_extraction(resume_text: str) -> StudentProfileCreate:
    """
    Generic section-aware heuristic parser that extracts structured profile data
    from ANY resume when Gemini API quota is depleted (HTTP 429).

    Unlike a hardcoded extractor, this parser:
    - Detects the candidate's actual name from the header
    - Extracts real email, education, skills, projects, and experiences
    - Uses a comprehensive 80+ skill catalog with auto-proficiency estimation
    - Works for any candidate, not just a specific person
    """
    from typing import List as TList

    # =========================================================================
    # 1. Segment resume into canonical sections
    # =========================================================================
    section_headers = [
        "PROFESSIONAL SUMMARY", "SUMMARY", "OBJECTIVE", "ABOUT",
        "TECHNICAL SKILLS", "SKILLS", "CORE COMPETENCIES", "TECHNOLOGIES",
        "EXPERIENCE", "WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT",
        "PROJECTS", "PROJECTS & HACKATHONS", "PERSONAL PROJECTS", "ACADEMIC PROJECTS",
        "LEADERSHIP", "LEADERSHIP & ACTIVITIES", "EXTRACURRICULAR", "ACTIVITIES",
        "EDUCATION", "ACADEMIC BACKGROUND",
        "CERTIFICATIONS", "CERTIFICATES", "AWARDS", "ACHIEVEMENTS",
        "PUBLICATIONS", "RESEARCH",
    ]
    sections: Dict[str, TList[str]] = {"HEADER": []}
    current_sec = "HEADER"

    # Normalize unicode punctuation
    resume_text = (
        resume_text.replace("\ufffd", " - ")
        .replace("—", " - ")
        .replace("–", " - ")
        .replace("•", "*")
    )
    lines = [l.strip() for l in resume_text.splitlines() if l.strip()]

    for line in lines:
        upper_line = re.sub(r"[^A-Z\s&]", "", line.upper()).strip()
        matched_header = None
        for h in section_headers:
            if upper_line == h or upper_line == h.replace("&", "AND"):
                matched_header = h
                break
        if matched_header:
            # Normalize similar headers
            if matched_header in ("WORK EXPERIENCE", "PROFESSIONAL EXPERIENCE", "EMPLOYMENT"):
                matched_header = "EXPERIENCE"
            elif matched_header in ("TECHNICAL SKILLS", "CORE COMPETENCIES", "TECHNOLOGIES"):
                matched_header = "SKILLS"
            elif matched_header in ("PROJECTS & HACKATHONS", "PERSONAL PROJECTS", "ACADEMIC PROJECTS"):
                matched_header = "PROJECTS"
            elif matched_header in ("ACADEMIC BACKGROUND",):
                matched_header = "EDUCATION"
            current_sec = matched_header
            if current_sec not in sections:
                sections[current_sec] = []
        else:
            sections.setdefault(current_sec, []).append(line)

    # =========================================================================
    # 2. Extract Candidate Name (from header — first non-contact, non-section line)
    # =========================================================================
    full_name = "Candidate"
    header_lines = sections.get("HEADER", []) or lines[:8]
    skip_words = {"SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS",
                  "RESUME", "CURRICULUM", "VITAE", "CV", "OBJECTIVE", "PROFESSIONAL"}
    for hl in header_lines:
        # Skip contact info lines
        if re.search(r"[@\+\:\d]|github|linkedin|http|phone|email|www\.|\.com|\.org", hl, re.I):
            continue
        clean = re.sub(r"[^a-zA-Z\s.]", "", hl).strip()
        if not clean:
            continue
        if any(h in clean.upper() for h in skip_words):
            continue
        words = clean.split()
        if 1 <= len(words) <= 5 and all(len(w) > 1 for w in words):
            full_name = clean.title()
            break

    # =========================================================================
    # 3. Extract Email
    # =========================================================================
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", resume_text)
    email = email_match.group(0).lower() if email_match else None

    # =========================================================================
    # 4. Extract Education (generic — works for any institution)
    # =========================================================================
    edu_lines = sections.get("EDUCATION", [])
    university = None
    degree = None
    grad_year = None
    gpa = None
    gpa_scale = 10.0  # Default to /10

    institution_keywords = [
        "institute", "university", "college", "polytechnic", "school",
        "academy", "iit", "nit", "iiit", "bits", "vit", "mit", "stanford",
        "harvard", "caltech", "carnegie", "georgia tech",
    ]
    degree_keywords = [
        "b.tech", "bachelor", "b.s.", "b.sc", "b.e.", "b.eng",
        "m.tech", "master", "m.s.", "m.sc", "mba", "ph.d", "phd",
        "computer science", "engineering", "information technology",
        "data science", "artificial intelligence", "electronics",
    ]

    for el in edu_lines:
        el_lower = el.lower()
        # Detect institution
        if not university and any(w in el_lower for w in institution_keywords):
            # Take the first part before | or , or ( as the institution name
            parts = re.split(r"[|,(]", el)
            university = parts[0].strip()

        # Detect degree
        if not degree and any(w in el_lower for w in degree_keywords):
            clean_deg = re.sub(r"[\ufffd—–]+", "-", el.strip())
            degree = re.sub(r"\s+", " ", clean_deg)

        # Extract graduation year
        year_matches = re.findall(r"\b(20[1-3][0-9])\b", el)
        if year_matches and not grad_year:
            grad_year = int(year_matches[-1])

        # Extract GPA/CGPA
        gpa_match = re.search(r"(?:cgpa|gpa|sgpa|grade)[:\s]*([0-9]+\.?[0-9]*)\s*(?:/\s*([0-9]+\.?[0-9]*))?", el_lower)
        if gpa_match and not gpa:
            try:
                val = float(gpa_match.group(1))
                if gpa_match.group(2):
                    gpa_scale = float(gpa_match.group(2))
                elif val <= 4.0:
                    gpa_scale = 4.0
                elif val <= 10.0:
                    gpa_scale = 10.0
                elif val <= 100:
                    gpa_scale = 100.0
                    val = val  # percentage
                gpa = val
            except (ValueError, TypeError):
                pass

        # Also check for percentage
        pct_match = re.search(r"(\d{2,3})\s*%", el)
        if pct_match and not gpa:
            try:
                pct = float(pct_match.group(1))
                gpa = round(pct / 10, 2)
                gpa_scale = 10.0
            except (ValueError, TypeError):
                pass

    # =========================================================================
    # 5. Extract Technical Skills (comprehensive 80+ skill catalog)
    # =========================================================================
    SKILL_CATALOG = {
        # Languages
        "Python": "language", "JavaScript": "language", "TypeScript": "language",
        "Java": "language", "C++": "language", "C": "language", "C#": "language",
        "Go": "language", "Rust": "language", "Ruby": "language", "PHP": "language",
        "Swift": "language", "Kotlin": "language", "Scala": "language",
        "R": "language", "MATLAB": "language", "Perl": "language",
        "SQL": "language", "Bash": "language", "Shell": "language",
        "Dart": "language", "Lua": "language", "Haskell": "language",
        "HTML": "language", "CSS": "language", "SASS": "language",
        # Frameworks & Libraries
        "React": "framework", "Angular": "framework", "Vue.js": "framework",
        "Next.js": "framework", "Svelte": "framework", "jQuery": "framework",
        "Node.js": "framework", "Express.js": "framework", "Django": "framework",
        "Flask": "framework", "FastAPI": "framework", "Spring Boot": "framework",
        "Spring": "framework", "Ruby on Rails": "framework", "Laravel": "framework",
        "ASP.NET": "framework", ".NET": "framework",
        "React Native": "framework", "Flutter": "framework",
        "TensorFlow": "framework", "PyTorch": "framework", "Keras": "framework",
        "scikit-learn": "framework", "Pandas": "framework", "NumPy": "framework",
        "OpenCV": "framework", "Hugging Face": "framework",
        "Tailwind CSS": "framework", "Bootstrap": "framework", "Material UI": "framework",
        # Tools & Platforms
        "Docker": "tool", "Kubernetes": "tool", "AWS": "tool", "GCP": "tool",
        "Azure": "tool", "Git": "tool", "GitHub": "tool", "GitLab": "tool",
        "Linux": "tool", "PostgreSQL": "tool", "MySQL": "tool", "MongoDB": "tool",
        "Redis": "tool", "Elasticsearch": "tool", "Kafka": "tool",
        "Terraform": "tool", "Ansible": "tool", "Jenkins": "tool",
        "CircleCI": "tool", "Travis CI": "tool", "GitHub Actions": "tool",
        "Firebase": "tool", "Supabase": "tool", "Vercel": "tool", "Heroku": "tool",
        "Nginx": "tool", "Apache": "tool", "Postman": "tool",
        "Figma": "tool", "Jira": "tool", "Confluence": "tool",
        "Power BI": "tool", "Tableau": "tool", "Grafana": "tool",
        "RabbitMQ": "tool", "GraphQL": "tool", "gRPC": "tool",
        "Selenium": "tool", "Cypress": "tool", "Jest": "tool",
        "Bright Data": "tool", "Webpack": "tool", "Vite": "tool",
        "Google Cloud Platform": "tool",
        # Concepts
        "Machine Learning": "concept", "Deep Learning": "concept",
        "Natural Language Processing": "concept", "Computer Vision": "concept",
        "Generative AI": "concept", "Large Language Models": "concept",
        "Data Structures & Algorithms": "concept", "System Design": "concept",
        "RESTful APIs": "concept", "Microservices": "concept",
        "Network Security": "concept", "Penetration Testing": "concept",
        "Cryptography": "concept", "Cloud Architecture": "concept",
        "DevOps": "concept", "CI/CD": "concept", "MLOps": "concept",
        "Data Engineering": "concept", "Data Visualization": "concept",
        "Statistical Analysis": "concept", "Agile/Scrum": "concept",
        "Testing & QA": "concept", "SIEM Tools": "concept",
        "Incident Response": "concept", "Blockchain": "concept",
        "Web Scraping": "concept", "API Development": "concept",
        "Object-Oriented Programming": "concept",
    }

    # Build search text
    skills_text = " ".join(sections.get("SKILLS", []))
    full_text_lower = resume_text.lower()
    skills_text_lower = skills_text.lower() if skills_text else full_text_lower

    # Alias mapping for common abbreviations
    ALIASES = {
        "react.js": "React", "reactjs": "React", "react js": "React",
        "node.js": "Node.js", "nodejs": "Node.js", "node js": "Node.js",
        "express.js": "Express.js", "expressjs": "Express.js",
        "next.js": "Next.js", "nextjs": "Next.js",
        "vue.js": "Vue.js", "vuejs": "Vue.js",
        "spring boot": "Spring Boot",
        "google cloud": "Google Cloud Platform", "gcp": "Google Cloud Platform",
        "amazon web services": "AWS",
        "microsoft azure": "Azure",
        "tailwind": "Tailwind CSS", "tailwindcss": "Tailwind CSS",
        "scikit-learn": "scikit-learn", "sklearn": "scikit-learn",
        "tensorflow": "TensorFlow",
        "pytorch": "PyTorch",
        "numpy": "NumPy", "pandas": "Pandas",
        "opencv": "OpenCV",
        "postgresql": "PostgreSQL", "postgres": "PostgreSQL",
        "mongodb": "MongoDB", "mongo": "MongoDB",
        "elasticsearch": "Elasticsearch", "elastic": "Elasticsearch",
        "ml": "Machine Learning", "machine learning": "Machine Learning",
        "dl": "Deep Learning", "deep learning": "Deep Learning",
        "nlp": "Natural Language Processing",
        "cv": "Computer Vision", "computer vision": "Computer Vision",
        "gen ai": "Generative AI", "generative ai": "Generative AI",
        "llm": "Large Language Models", "llms": "Large Language Models",
        "dsa": "Data Structures & Algorithms",
        "ci/cd": "CI/CD", "cicd": "CI/CD",
        "devops": "DevOps",
        "bright data": "Bright Data",
        "rest api": "RESTful APIs", "restful": "RESTful APIs",
        "github actions": "GitHub Actions",
        "power bi": "Power BI",
        "ruby on rails": "Ruby on Rails", "rails": "Ruby on Rails",
        "asp.net": "ASP.NET",
        "material ui": "Material UI", "mui": "Material UI",
        "hugging face": "Hugging Face", "huggingface": "Hugging Face",
    }

    detected_skills = []
    seen_skills = set()

    # Check aliases first
    for alias, canonical in ALIASES.items():
        if alias in full_text_lower and canonical not in seen_skills:
            seen_skills.add(canonical)

    # Check direct skill mentions
    for skill_name in SKILL_CATALOG:
        if skill_name in seen_skills:
            continue
        pattern = r"\b" + re.escape(skill_name.lower()) + r"\b"
        if re.search(pattern, skills_text_lower) or re.search(pattern, full_text_lower):
            seen_skills.add(skill_name)

    # Estimate proficiency based on mention context
    for skill_name in seen_skills:
        if skill_name not in SKILL_CATALOG:
            continue

        # Count mentions across different sections
        pattern = r"\b" + re.escape(skill_name.lower()) + r"\b"
        # Check for aliases too
        mention_count = len(re.findall(pattern, full_text_lower))
        for alias, canonical in ALIASES.items():
            if canonical == skill_name:
                mention_count += len(re.findall(re.escape(alias), full_text_lower))

        in_skills_section = bool(re.search(pattern, skills_text_lower)) if skills_text else False
        in_projects = bool(re.search(pattern, " ".join(sections.get("PROJECTS", [])).lower()))
        in_experience = bool(re.search(pattern, " ".join(sections.get("EXPERIENCE", [])).lower()))

        # Auto-proficiency estimation
        proficiency = 2  # Base: elementary
        if in_skills_section:
            proficiency = 3
        if in_projects:
            proficiency = max(proficiency, 3)
        if in_experience:
            proficiency = max(proficiency, 4)
        if mention_count >= 5:
            proficiency = max(proficiency, 4)
        if mention_count >= 8 and in_experience:
            proficiency = 5

        # Build evidence
        evidence_parts = []
        if in_skills_section:
            evidence_parts.append("listed in skills section")
        if in_projects:
            evidence_parts.append("used in projects")
        if in_experience:
            evidence_parts.append("applied in work experience")
        evidence = "; ".join(evidence_parts) if evidence_parts else f"mentioned {mention_count}x in resume"

        detected_skills.append(SkillEntryCreate(
            skill_name=skill_name,
            proficiency=proficiency,
            evidence=evidence,
            source="extracted",
        ))

    # Sort by proficiency (highest first)
    detected_skills.sort(key=lambda s: s.proficiency, reverse=True)

    # =========================================================================
    # 6. Extract Experience (generic parsing)
    # =========================================================================
    exp_lines = sections.get("EXPERIENCE", [])
    experiences = []

    if exp_lines:
        current_title = None
        current_company = None
        current_desc_lines = []
        current_duration = None
        current_type = ExperienceType.INTERNSHIP

        for line in exp_lines:
            # Check for title/company patterns: "Title at Company" or "Title | Company" or "Title, Company"
            title_match = re.match(
                r"^(.+?)\s*(?:at|@|\||-|,)\s*(.+?)(?:\s*\|.*)?$", line
            )
            # Check for date patterns indicating a new entry
            has_date = bool(re.search(
                r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|\d{4})",
                line.lower()
            ))

            if title_match and has_date:
                # Save previous experience
                if current_title:
                    experiences.append(ExperienceCreate(
                        title=current_title,
                        company=current_company or "Company",
                        duration_months=current_duration or 3,
                        experience_type=current_type,
                        description=" ".join(current_desc_lines)[:500] if current_desc_lines else None,
                    ))

                current_title = title_match.group(1).strip()
                current_company = title_match.group(2).strip()
                # Remove date info from company name
                current_company = re.sub(r"\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current|\d{4}).*$", "", current_company, flags=re.I).strip()
                current_desc_lines = []
                current_duration = _estimate_duration(line)
                current_type = ExperienceType.INTERNSHIP if "intern" in line.lower() else ExperienceType.FULL_TIME

            elif not title_match and has_date and not current_title:
                # Might be a simpler format: "Company Name" on one line, dates on another
                # Or "Title" followed by company
                clean = re.sub(r"[*\-–]", "", line).strip()
                if clean and len(clean.split()) <= 8:
                    if not current_title:
                        current_title = clean
                    elif not current_company:
                        current_company = clean
            elif line.startswith(("*", "-", "–", "•")) or line.startswith("  "):
                # Description bullet point
                cleaned = re.sub(r"^[*\-–•]\s*", "", line).strip()
                if cleaned:
                    current_desc_lines.append(cleaned)
            elif current_title is None:
                # First non-bullet line could be title
                clean = re.sub(r"[*\-–]", "", line).strip()
                if clean and len(clean.split()) <= 10:
                    current_title = clean

        # Don't forget the last experience
        if current_title:
            experiences.append(ExperienceCreate(
                title=current_title,
                company=current_company or "Company",
                duration_months=current_duration or 3,
                experience_type=current_type,
                description=" ".join(current_desc_lines)[:500] if current_desc_lines else None,
            ))

    # =========================================================================
    # 7. Extract Projects (generic parsing)
    # =========================================================================
    proj_lines = sections.get("PROJECTS", [])
    projects = []

    if proj_lines:
        current_proj_title = None
        current_proj_desc_lines = []
        current_proj_techs = []

        for line in proj_lines:
            # Project title line: usually starts without a bullet, or has a link
            is_bullet = line.startswith(("*", "-", "–", "•", "  "))

            if not is_bullet and len(line.split()) <= 15:
                # Save previous project
                if current_proj_title:
                    projects.append(ProjectCreate(
                        title=current_proj_title,
                        description=" ".join(current_proj_desc_lines)[:500] if current_proj_desc_lines else f"Project: {current_proj_title}",
                        technologies=current_proj_techs if current_proj_techs else [s.skill_name for s in detected_skills[:3]],
                        complexity=_estimate_project_complexity(current_proj_desc_lines),
                    ))

                current_proj_title = re.sub(r"[*\-–•]", "", line).strip()
                # Remove URLs from title
                current_proj_title = re.sub(r"https?://\S+", "", current_proj_title).strip()
                current_proj_desc_lines = []
                current_proj_techs = []
            elif is_bullet:
                cleaned = re.sub(r"^[*\-–•]\s*", "", line).strip()
                if cleaned:
                    current_proj_desc_lines.append(cleaned)
                    # Detect technologies mentioned in description
                    for skill_name in seen_skills:
                        if skill_name.lower() in cleaned.lower() and skill_name not in current_proj_techs:
                            current_proj_techs.append(skill_name)

        # Save last project
        if current_proj_title:
            projects.append(ProjectCreate(
                title=current_proj_title,
                description=" ".join(current_proj_desc_lines)[:500] if current_proj_desc_lines else f"Project: {current_proj_title}",
                technologies=current_proj_techs if current_proj_techs else [s.skill_name for s in detected_skills[:3]],
                complexity=_estimate_project_complexity(current_proj_desc_lines),
            ))

    # Fallback: if no projects found, create one from overall resume context
    if not projects:
        projects.append(ProjectCreate(
            title="Technical Project",
            description="Technical project referenced in resume portfolio.",
            technologies=[s.skill_name for s in detected_skills[:4]],
            complexity=3,
        ))

    return StudentProfileCreate(
        full_name=full_name,
        email=email,
        university=university,
        degree=degree,
        graduation_year=grad_year,
        gpa=gpa,
        gpa_scale=gpa_scale,
        skills=detected_skills,
        projects=projects,
        experiences=experiences,
    )


def _estimate_duration(line: str) -> Optional[int]:
    """Estimate experience duration in months from a line with date references."""
    months_map = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    # Look for "Month Year - Month Year" or "Month Year - Present"
    date_pattern = r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*(\d{4})\s*[-–]\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\w*present|\w*current)\w*\s*(\d{4})?"
    match = re.search(date_pattern, line.lower())
    if match:
        start_month = months_map.get(match.group(1)[:3], 1)
        start_year = int(match.group(2))
        end_text = match.group(3).lower()
        if "present" in end_text or "current" in end_text:
            from datetime import datetime
            now = datetime.now()
            end_month, end_year = now.month, now.year
        else:
            end_month = months_map.get(end_text[:3], 12)
            end_year = int(match.group(4)) if match.group(4) else start_year
        duration = (end_year - start_year) * 12 + (end_month - start_month)
        return max(1, duration)
    return None


def _estimate_project_complexity(desc_lines: list) -> int:
    """Estimate project complexity from description lines."""
    text = " ".join(desc_lines).lower()
    complexity = 2  # Base

    # Indicators of higher complexity
    if any(w in text for w in ["deployed", "production", "live", "users", "scale"]):
        complexity = max(complexity, 4)
    elif any(w in text for w in ["api", "database", "authentication", "full-stack", "fullstack"]):
        complexity = max(complexity, 3)
    elif any(w in text for w in ["hackathon", "competition", "award", "winner"]):
        complexity = max(complexity, 3)

    # Length-based heuristic
    if len(desc_lines) >= 4:
        complexity = max(complexity, 3)
    if len(desc_lines) >= 6:
        complexity = max(complexity, 4)

    return min(complexity, 5)


def _fallback_coach_response(student_context: str, user_message: str) -> str:
    """Intelligent grounded rule-based coaching response when Gemini quota is depleted.
    Parses the student context and user message to generate dynamic, relevant advice."""

    msg_lower = user_message.lower()

    # Extract key data from context
    lines = student_context.split('\n')
    skills = []
    gaps = []
    score = None
    percentile = None
    career_fits = []
    projects = []
    gpa_info = None

    section = ""
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("## "):
            section = stripped
        elif section.startswith("## Skills") and stripped.startswith("- "):
            skills.append(stripped[2:])
        elif section.startswith("## Skill Gaps") and stripped.startswith("- "):
            gaps.append(stripped[2:])
        elif section.startswith("## Career Fit") and stripped.startswith("- "):
            career_fits.append(stripped[2:])
        elif section.startswith("## Projects") and stripped.startswith("- "):
            projects.append(stripped[2:])
        elif "Overall Score:" in stripped:
            score = stripped.split(":")[-1].strip()
        elif "Percentile:" in stripped:
            percentile = stripped.split(":")[-1].strip()
        elif stripped.startswith("GPA:"):
            gpa_info = stripped

    # Build dynamic response based on question topic
    if any(w in msg_lower for w in ['score', 'rank', 'ready', 'readiness', 'how am i', 'where do i stand']):
        response = f"Based on your profile data:\n\n"
        if score:
            response += f"**Your Readiness Score: {score}**"
            if percentile:
                response += f" — placing you at the {percentile}\n\n"
        if gaps:
            response += f"**Priority Gaps to Close:**\n"
            for g in gaps[:4]:
                response += f"- {g}\n"
            response += f"\nClosing even 2-3 of these gaps could push your score significantly higher.\n"
        if not gaps and skills:
            response += f"Your strongest skills include: {', '.join(s.split(':')[0] for s in skills[:4])}. Keep building on these.\n"
        return response

    elif any(w in msg_lower for w in ['skill', 'learn', 'improve', 'gap', 'weak', 'missing']):
        response = f"Looking at your skill profile:\n\n"
        if skills:
            response += f"**Your {len(skills)} Skills:**\n"
            for s in skills[:5]:
                response += f"- {s}\n"
        if gaps:
            response += f"\n**Key Gaps to Address:**\n"
            for g in gaps[:4]:
                response += f"- {g}\n"
            response += f"\n**Action Step**: Pick the highest-priority gap and dedicate 2-3 hours/week to hands-on practice. Build a small project around it to demonstrate competence.\n"
        else:
            response += f"\nYour skill coverage looks solid. Focus on deepening proficiency in your top skills through increasingly complex projects.\n"
        return response

    elif any(w in msg_lower for w in ['career', 'job', 'fit', 'match', 'role', 'path']):
        response = f"Based on your career fit analysis:\n\n"
        if career_fits:
            for c in career_fits[:4]:
                response += f"- {c}\n"
            response += f"\n**Note**: This system provides a readiness benchmark, not an employment guarantee. Focus on closing gaps for your top-fit career.\n"
        else:
            response += f"I don't have detailed career match data loaded right now. Try refreshing your profile analysis for updated career fits.\n"
        return response

    elif any(w in msg_lower for w in ['project', 'portfolio', 'build', 'github']):
        response = f"Looking at your projects:\n\n"
        if projects:
            for p in projects[:4]:
                response += f"- {p}\n"
            response += f"\n**Recommendation**: Aim for at least 2-3 projects with verifiable GitHub repos. Employers value deployed, documented projects over quantity. Include clear READMEs, architecture diagrams, and measurable outcomes.\n"
        else:
            response += f"You don't have many projects yet. Start with a small full-stack app or contribute to open-source to build your portfolio.\n"
        return response

    elif any(w in msg_lower for w in ['roadmap', 'plan', 'next', 'step', 'what should']):
        response = f"Here's my recommended approach:\n\n"
        response += f"1. **Week 1-2**: Close your highest-priority skill gap through hands-on practice\n"
        response += f"2. **Week 3-4**: Build or extend a project showcasing that new skill\n"
        response += f"3. **Ongoing**: Push code regularly — consistent GitHub activity matters\n\n"
        if gaps:
            response += f"**Your top gap**: {gaps[0]}\n"
        if score:
            response += f"**Current score**: {score} — each completed roadmap item can boost this.\n"
        return response

    else:
        # General contextual response
        response = f"Great question! Here's what I see in your profile:\n\n"
        if score:
            response += f"- **Readiness**: {score}"
            if percentile:
                response += f" ({percentile})"
            response += "\n"
        if skills:
            response += f"- **Skills**: {len(skills)} tracked — strongest in {skills[0].split(':')[0] if skills else 'N/A'}\n"
        if gaps:
            response += f"- **Top Gap**: {gaps[0]}\n"
        if gpa_info:
            response += f"- **{gpa_info}**\n"
        response += f"\nFeel free to ask me specifically about your skills, career fit, gaps, roadmap, or score breakdown — I can give you more targeted advice!\n"
        return response


def _fallback_embedding(text: str, dim: int = 768) -> list:
    """Deterministic normalized pseudo-embedding when Gemini embedding API quota is depleted."""
    vec = [0.0] * dim
    tokens = re.findall(r"\w+", text.lower())
    for i, token in enumerate(tokens):
        h = int(hashlib.md5(token.encode()).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0 / (1.0 + (i * 0.05))
    norm = sum(x * x for x in vec) ** 0.5
    if norm > 0:
        vec = [round(x / norm, 5) for x in vec]
    return vec


async def extract_profile_from_resume(resume_text: str) -> StudentProfileCreate:
    """
    Extract a structured student profile from resume text using Gemini.
    Guaranteed fast resolution: if Gemini does not respond within 6 seconds,
    falls back gracefully and instantaneously to intelligent heuristic extraction.
    """
    if not settings.gemini_api_key:
        logger.info("gemini_key_not_configured_using_heuristic")
        return _fallback_heuristic_extraction(resume_text)

    prompt_template = _load_prompt("profile_extraction.txt")
    prompt = prompt_template.replace("{resume_text}", resume_text)

    model = _get_model()

    try:
        logger.info("gemini_extraction_attempt_with_timeout")
        # Strict 6-second network deadline prevents UI hanging
        response = await asyncio.to_thread(_generate_with_fallback, model, prompt, 0.1, 4096, 6.0)

        if response and response.text:
            cleaned = _clean_json_response(response.text)
            data = json.loads(cleaned)
            profile = StudentProfileCreate(**data)
            logger.info(
                "gemini_extraction_success",
                skills_count=len(profile.skills),
                projects_count=len(profile.projects),
                experiences_count=len(profile.experiences),
            )
            return profile
    except Exception as exc:
        logger.warning("gemini_extraction_error_falling_back_to_heuristic", error=str(exc))

    logger.info("using_instant_heuristic_extraction")
    return _fallback_heuristic_extraction(resume_text)


async def generate_coach_response(
    student_context: str,
    user_message: str,
    conversation_history: str = "",
) -> str:
    """
    Generate a coaching response grounded in the student's actual data.
    Falls back gracefully to domain-grounded advice if Gemini quota is depleted.
    """
    if not settings.gemini_api_key:
        return _fallback_coach_response(student_context, user_message)

    try:
        prompt_template = _load_prompt("coach_system.txt")
        prompt = (
            prompt_template
            .replace("{student_context}", student_context)
            .replace("{user_message}", user_message)
            .replace("{conversation_history}", conversation_history or "No previous messages.")
        )

        model = _get_model(temperature=0.4, max_output_tokens=2048)
        response = await asyncio.wait_for(
            asyncio.to_thread(_generate_with_fallback, model, prompt, 0.4, 2048),
            timeout=8.0,
        )

        if not response or not response.text:
            return _fallback_coach_response(student_context, user_message)

        logger.info("coach_response_generated", message_length=len(response.text))
        return response.text.strip()

    except asyncio.TimeoutError:
        logger.warning("coach_generation_timeout_using_rule_fallback")
        return _fallback_coach_response(student_context, user_message)
    except Exception as exc:
        logger.warning("coach_generation_error_using_rule_fallback", error=str(exc))
        return _fallback_coach_response(student_context, user_message)


async def generate_embedding(text: str) -> list:
    """
    Generate a text embedding using Gemini's embedding model.
    Falls back gracefully to deterministic normalized hash embedding if Gemini quota is depleted.
    """
    if not settings.gemini_api_key:
        return _fallback_embedding(text)

    try:
        result = genai.embed_content(
            model=f"models/{settings.gemini_embedding_model}",
            content=text,
            task_type="retrieval_document",
        )
        return result["embedding"]
    except Exception as exc:
        logger.warning("embedding_generation_error_using_hash_fallback", error=str(exc))
        return _fallback_embedding(text)
