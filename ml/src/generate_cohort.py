"""
CareerAI — Synthetic Student Cohort Generator

Generates realistic student profiles with a genuine score spread (bell curve),
computes their deterministic readiness scores and ranks, and exports both:
1. JSON dataset: ml/data/synthetic_cohort.json
2. SQL seed script: database/seed_cohort.sql (for PostgreSQL seeding)
"""

import json
import os
import random
import sys
import uuid
from typing import List, Dict, Any

# Ensure ML package is resolvable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ml.src.scoring import compute_readiness_score
from ml.src.ranking import compute_percentile, compute_rank

LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "SQL", "Bash"]
FRAMEWORKS = ["React", "Node.js", "Django", "FastAPI", "TensorFlow", "PyTorch", "scikit-learn", "Next.js"]
TOOLS = ["Docker", "Kubernetes", "AWS", "Git", "PostgreSQL", "MongoDB", "Redis", "CI/CD"]
DOMAINS = ["Machine Learning", "Web Development", "Cloud Architecture", "Data Science", "Cybersecurity"]

FIRST_NAMES = ["Alex", "Priya", "Carlos", "Aisha", "Liam", "Yuki", "David", "Fatima", "Chen", "Sofia", "Marcus", "Elena"]
LAST_NAMES = ["Patel", "Smith", "Wang", "Kim", "Garcia", "Johnson", "Al-Mansoor", "Ivanov", "Singh", "Nguyen"]
COLLEGES = ["MIT", "Stanford University", "Carnegie Mellon", "UC Berkeley", "Georgia Tech", "State Engineering College"]
DEGREES = ["B.Tech Computer Science", "B.S. Software Engineering", "B.Tech Information Technology", "B.S. Data Science"]


def generate_student(student_idx: int) -> Dict[str, Any]:
    """Generate a single realistic synthetic student profile with balanced attributes."""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    student_id = str(uuid.uuid4())
    email = f"{first.lower()}.{last.lower()}{student_idx}@example.edu"

    # Academic profile with normal distribution (mean 3.3, std 0.4)
    cgpa = round(random.gauss(3.3, 0.4), 2)
    cgpa = max(2.2, min(4.0, cgpa))
    graduation_year = random.choice([2024, 2025, 2026, 2027])

    # Skills selection
    num_langs = random.randint(2, 5)
    num_frameworks = random.randint(1, 4)
    num_tools = random.randint(1, 4)

    student_skills = []
    chosen_langs = random.sample(LANGUAGES, num_langs)
    for lang in chosen_langs:
        prof = random.choices([1, 2, 3, 4, 5], weights=[10, 25, 35, 20, 10])[0]
        student_skills.append({
            "skill_name": lang,
            "category": "language",
            "proficiency": prof,
            "evidence": f"Used in academic coursework and projects."
        })

    chosen_frameworks = random.sample(FRAMEWORKS, min(num_frameworks, len(FRAMEWORKS)))
    for fw in chosen_frameworks:
        prof = random.choices([1, 2, 3, 4, 5], weights=[15, 30, 30, 18, 7])[0]
        student_skills.append({
            "skill_name": fw,
            "category": "framework",
            "proficiency": prof,
            "evidence": f"Built applications with {fw}."
        })

    chosen_tools = random.sample(TOOLS, min(num_tools, len(TOOLS)))
    for tool in chosen_tools:
        prof = random.choices([1, 2, 3, 4, 5], weights=[20, 35, 25, 15, 5])[0]
        student_skills.append({
            "skill_name": tool,
            "category": "tool",
            "proficiency": prof,
            "evidence": f"Employed {tool} in development workflows."
        })

    # Projects
    num_projects = random.choices([1, 2, 3, 4], weights=[20, 45, 25, 10])[0]
    projects = []
    for p_idx in range(num_projects):
        domain = random.choice(DOMAINS)
        complexity = random.choice([1, 2, 3, 4, 5])
        projects.append({
            "title": f"{domain} {random.choice(['Platform', 'Analyzer', 'System', 'Dashboard', 'Engine'])}",
            "description": f"Designed and deployed a full-featured system solving domain challenges.",
            "technologies": random.sample(chosen_langs + chosen_frameworks, min(3, len(chosen_langs + chosen_frameworks))),
            "complexity": complexity,
        })

    # Experience
    has_internship = random.choice([True, False, False])
    experiences = []
    if has_internship:
        experiences.append({
            "company": f"{random.choice(['Acme Corp', 'Apex Innovations', 'NovaTech', 'Global Systems'])}",
            "title": "Software Engineering Intern",
            "duration_months": random.choice([2, 3, 6]),
            "experience_type": "internship"
        })

    # Hackathons / Achievements
    hackathons = random.choices([0, 1, 2, 3], weights=[50, 30, 15, 5])[0]
    achievements = [f"Hackathon finalist #{i+1}" for i in range(hackathons)]

    return {
        "id": student_id,
        "full_name": f"{first} {last}",
        "email": email,
        "university": random.choice(COLLEGES),
        "degree": random.choice(DEGREES),
        "graduation_year": graduation_year,
        "gpa": cgpa,
        "gpa_scale": 4.0,
        "skills": student_skills,
        "projects": projects,
        "experiences": experiences,
        "achievements": achievements,
    }


def generate_cohort(cohort_size: int = 100) -> List[Dict[str, Any]]:
    """Generate a full cohort with scored and ranked students."""
    random.seed(42)  # Deterministic seed for reproducible scoring
    students = [generate_student(i + 1) for i in range(cohort_size)]

    # Compute deterministic scores
    raw_scores = []
    for s in students:
        score_res = compute_readiness_score(
            skills=s["skills"],
            projects=s["projects"],
            experiences=s["experiences"],
            gpa=s["gpa"],
            gpa_scale=s["gpa_scale"],
            degree=s["degree"],
            achievements=s["achievements"],
        )
        s["score_result"] = {
            "overall_score": score_res.overall_score,
            "technical_score": score_res.technical_skills,
            "projects_score": score_res.projects,
            "academics_score": score_res.academics,
            "experience_score": score_res.experience,
            "assessments_score": score_res.assessments,
            "achievements_score": score_res.achievements,
        }
        raw_scores.append(score_res.overall_score)

    # Compute percentiles and ranks across the cohort
    for s in students:
        score = s["score_result"]["overall_score"]
        s["score_result"]["percentile"] = compute_percentile(score, raw_scores)
        s["score_result"]["rank"] = compute_rank(score, raw_scores)
        s["score_result"]["cohort_size"] = cohort_size

    return students


def export_cohort_sql(cohort: List[Dict[str, Any]], filepath: str):
    """Export cohort as SQL insert statements matching database/schema.sql."""
    lines = [
        "-- =============================================================================",
        "-- CareerAI — Synthetic Student Cohort Seed (100 Students with Bell Curve Spread)",
        "-- =============================================================================",
        "",
    ]

    for s in cohort:
        sid = s["id"]
        fname = s["full_name"].replace("'", "''")
        email = s["email"]
        univ = s["university"].replace("'", "''")
        deg = s["degree"].replace("'", "''")
        gyear = s["graduation_year"]
        gpa = s["gpa"]
        res = s["score_result"]

        lines.append(
            f"INSERT INTO students (id, full_name, email, university, degree, graduation_year, gpa, gpa_scale, profile_confirmed) "
            f"VALUES ('{sid}', '{fname}', '{email}', '{univ}', '{deg}', {gyear}, {gpa}, 4.0, TRUE) "
            f"ON CONFLICT (id) DO NOTHING;"
        )

        lines.append(
            f"INSERT INTO student_scores (student_id, overall_score, technical_score, projects_score, academics_score, experience_score, assessments_score, achievements_score, percentile, cohort_rank, cohort_size) "
            f"VALUES ('{sid}', {res['overall_score']}, {res['technical_score']}, {res['projects_score']}, {res['academics_score']}, {res['experience_score']}, {res['assessments_score']}, {res['achievements_score']}, {res['percentile']}, {res['rank']}, {res['cohort_size']});"
        )

        for p in s["projects"]:
            pid = str(uuid.uuid4())
            title = p["title"].replace("'", "''")
            desc = p["description"].replace("'", "''")
            tech_str = "ARRAY[" + ", ".join(f"'{t}'" for t in p["technologies"]) + "]"
            comp = p["complexity"]
            lines.append(
                f"INSERT INTO projects (id, student_id, title, description, technologies, complexity) "
                f"VALUES ('{pid}', '{sid}', '{title}', '{desc}', {tech_str}, {comp});"
            )

        for exp in s["experiences"]:
            eid = str(uuid.uuid4())
            etitle = exp["title"].replace("'", "''")
            comp = exp["company"].replace("'", "''")
            dur = exp["duration_months"]
            etype = exp["experience_type"]
            lines.append(
                f"INSERT INTO experiences (id, student_id, title, company, duration_months, experience_type) "
                f"VALUES ('{eid}', '{sid}', '{etitle}', '{comp}', {dur}, '{etype}');"
            )

        lines.append("")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    cohort = generate_cohort(100)

    # Save JSON
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_cohort.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(cohort, f, indent=2)

    # Save SQL Seed
    sql_path = os.path.join(os.path.dirname(__file__), "..", "..", "database", "seed_cohort.sql")
    export_cohort_sql(cohort, sql_path)

    scores = [s["score_result"]["overall_score"] for s in cohort]
    print(f"Generated {len(cohort)} students.")
    print(f"Score Range: {min(scores):.1f} - {max(scores):.1f}, Mean: {sum(scores)/len(scores):.1f}")
    print(f"Exported JSON: {json_path}")
    print(f"Exported SQL:  {sql_path}")
