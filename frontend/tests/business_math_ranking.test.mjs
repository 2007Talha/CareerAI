import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * 6-Dimension Readiness Index formula and statistical cohort ranking functions.
 */
const WEIGHTS = {
  technical_skills: 0.25,
  projects: 0.25,
  academics: 0.20,
  experience: 0.10,
  assessments: 0.10,
  achievements: 0.10,
};

function calculateOverallReadiness(scores) {
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += (scores[key] || 0) * weight;
  }
  return Math.min(100, Math.max(0, Math.round(total * 10) / 10));
}

function calculateZScore(score, mean = 68.5, stdDev = 12.4) {
  return Math.round(((score - mean) / stdDev) * 100) / 100;
}

function calculatePercentile(zScore) {
  // Approximate standard normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
  const d = 0.3989423 * Math.exp((-zScore * zScore) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (zScore > 0) p = 1 - p;
  return Math.min(99.9, Math.max(0.1, Math.round(p * 1000) / 10));
}

function calculateRecalculation(baseScore, completedCount, boostPerItem = 2.5) {
  const boost = completedCount * boostPerItem;
  return Math.min(100, Math.round((baseScore + boost) * 10) / 10);
}

describe('Business Math & Cohort Ranking Statistical Suite', () => {
  test('Readiness weight distribution sums exactly to 1.0 (100%)', () => {
    const sum = Object.values(WEIGHTS).reduce((acc, w) => acc + w, 0);
    assert.strictEqual(Math.round(sum * 100) / 100, 1.0);
  });

  test('Readiness index score is strictly bounded between 0 and 100', () => {
    const perfectScores = {
      technical_skills: 100,
      projects: 100,
      academics: 100,
      experience: 100,
      assessments: 100,
      achievements: 100,
    };
    assert.strictEqual(calculateOverallReadiness(perfectScores), 100);

    const zeroScores = {
      technical_skills: 0,
      projects: 0,
      academics: 0,
      experience: 0,
      assessments: 0,
      achievements: 0,
    };
    assert.strictEqual(calculateOverallReadiness(zeroScores), 0);
  });

  test('Weighted readiness score computes accurate fractional values', () => {
    const candidateScores = {
      technical_skills: 80,
      projects: 90,
      academics: 70,
      experience: 60,
      assessments: 85,
      achievements: 75,
    };
    // 80*0.25 (20) + 90*0.25 (22.5) + 70*0.20 (14) + 60*0.10 (6) + 85*0.10 (8.5) + 75*0.10 (7.5) = 78.5
    assert.strictEqual(calculateOverallReadiness(candidateScores), 78.5);
  });

  test('Cohort Z-score calculation reflects distance from population mean', () => {
    const averageZ = calculateZScore(68.5, 68.5, 12.4);
    assert.strictEqual(averageZ, 0.0);

    const highZ = calculateZScore(80.9, 68.5, 12.4);
    assert.strictEqual(highZ, 1.0);
  });

  test('Gaussian normal CDF derives accurate cohort percentile rank', () => {
    const avgPercentile = calculatePercentile(0.0);
    assert.strictEqual(avgPercentile, 50.0);

    const topCandidatePercentile = calculatePercentile(1.28);
    assert.strictEqual(topCandidatePercentile >= 89.0, true);
  });

  test('What-if milestone recalculation accurately caps at 100 without overflow', () => {
    const recalculated = calculateRecalculation(85.0, 3, 2.5); // 85.0 + 7.5 = 92.5
    assert.strictEqual(recalculated, 92.5);

    const capped = calculateRecalculation(98.0, 5, 2.5); // 98.0 + 12.5 = 110.5 -> caps at 100
    assert.strictEqual(capped, 100);
  });
});
