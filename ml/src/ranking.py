"""
CareerAI — Ranking Engine

Normalizes scores across the student cohort using scikit-learn's StandardScaler,
computes percentiles, and assigns ranks. This is what makes "68th percentile"
meaningful — not just a raw score, but a position relative to peers.
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np
from scipy import stats as scipy_stats


@dataclass(frozen=True)
class RankResult:
    """A student's position within the cohort."""
    percentile: float       # 0-100, higher is better
    rank: int               # 1-based, lower is better
    cohort_size: int
    z_score: float          # standard deviations from the mean


def compute_percentile(score: float, all_scores: List[float]) -> float:
    """
    Compute a student's percentile rank within a cohort.

    Uses scipy's percentileofscore for accurate computation,
    including handling of ties.

    Args:
        score: The student's score.
        all_scores: All scores in the cohort (including this student's).

    Returns:
        Percentile (0-100). 90 means "better than 90% of the cohort".
    """
    if not all_scores or len(all_scores) < 2:
        return 50.0  # Can't meaningfully rank with < 2 students

    percentile = scipy_stats.percentileofscore(all_scores, score, kind="rank")
    return round(float(percentile), 2)


def compute_rank(score: float, all_scores: List[float]) -> int:
    """
    Compute a student's rank (1 = highest score).

    Handles ties by assigning the same rank to equal scores.

    Args:
        score: The student's score.
        all_scores: All scores in the cohort.

    Returns:
        1-based rank.
    """
    if not all_scores:
        return 1

    # Sort descending — rank 1 is the highest score
    sorted_scores = sorted(all_scores, reverse=True)

    # Find position (handle ties — same score gets same rank)
    for i, s in enumerate(sorted_scores):
        if abs(s - score) < 1e-6:  # floating point comparison
            return i + 1

    return len(sorted_scores)  # shouldn't reach here, but safe fallback


def compute_z_score(score: float, all_scores: List[float]) -> float:
    """
    Compute the z-score (standard deviations from the mean).

    Args:
        score: The student's score.
        all_scores: All scores in the cohort.

    Returns:
        Z-score. Positive means above average.
    """
    if not all_scores or len(all_scores) < 2:
        return 0.0

    scores_array = np.array(all_scores)
    mean = float(np.mean(scores_array))
    std = float(np.std(scores_array, ddof=1))  # sample std dev

    if std < 1e-6:  # all scores are the same
        return 0.0

    return round((score - mean) / std, 4)


def rank_student(
    student_score: float,
    cohort_scores: List[float],
) -> RankResult:
    """
    Compute a student's full ranking within the cohort.

    Args:
        student_score: The student's overall readiness score.
        cohort_scores: All scores in the cohort (including this student's).

    Returns:
        RankResult with percentile, rank, cohort size, and z-score.
    """
    # Ensure student's score is in the cohort
    if student_score not in cohort_scores:
        cohort_scores = cohort_scores + [student_score]

    return RankResult(
        percentile=compute_percentile(student_score, cohort_scores),
        rank=compute_rank(student_score, cohort_scores),
        cohort_size=len(cohort_scores),
        z_score=compute_z_score(student_score, cohort_scores),
    )
