"""
Unit tests for CareerAI scoring and ranking ML engines.
"""

import unittest
import sys
import os

# Add root and ML module to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml")))

from ml.src.scoring import (
    compute_readiness_score,
    WEIGHTS,
)
from ml.src.ranking import (
    compute_percentile,
    compute_rank,
    compute_z_score,
    rank_student,
)
from ml.src.generate_cohort import generate_cohort, generate_student


class TestMLEngine(unittest.TestCase):
    def test_scoring_weights_sum_to_one(self):
        total_weight = sum(WEIGHTS.values())
        self.assertAlmostEqual(total_weight, 1.0, places=5)

    def test_compute_readiness_score_bounded(self):
        skills = [
            {"skill_name": "Python", "category": "language", "proficiency": 4},
            {"skill_name": "FastAPI", "category": "framework", "proficiency": 3},
            {"skill_name": "PostgreSQL", "category": "tool", "proficiency": 3},
        ]
        projects = [
            {"title": "CareerAI", "complexity": 4, "technologies": ["Python", "FastAPI"]}
        ]
        experiences = [
            {"duration_months": 6, "experience_type": "internship"}
        ]
        result = compute_readiness_score(
            skills=skills,
            projects=projects,
            experiences=experiences,
            gpa=3.8,
            gpa_scale=4.0,
            degree="B.Tech Computer Science",
        )
        self.assertTrue(0.0 <= result.overall_score <= 100.0)
        self.assertIn("technical_skills", result.breakdown)
        self.assertIn("projects", result.breakdown)
        self.assertIn("academics", result.breakdown)

    def test_ranking_percentile_and_rank(self):
        cohort = [50.0, 60.0, 70.0, 80.0, 90.0]
        rank_res = rank_student(85.0, cohort)
        self.assertEqual(rank_res.rank, 2)
        self.assertEqual(rank_res.cohort_size, 6)
        self.assertGreater(rank_res.percentile, 60.0)

    def test_synthetic_cohort_generation(self):
        cohort = generate_cohort(10)
        self.assertEqual(len(cohort), 10)
        student = cohort[0]
        self.assertIn("id", student)
        self.assertIn("skills", student)
        self.assertIn("projects", student)
        self.assertTrue(2.0 <= student["gpa"] <= 4.0)


if __name__ == "__main__":
    unittest.main()
