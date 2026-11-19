import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Entity CRUD and domain transformation testing for StudentProfile and SkillEntry.
 */
function createStudentProfile(payload) {
  const now = new Date().toISOString();
  return {
    id: payload.id || 'prof_' + Math.random().toString(36).substring(2, 10),
    full_name: payload.full_name || 'Candidate',
    email: payload.email || 'candidate@university.edu',
    university: payload.university || 'State University',
    degree: payload.degree || 'B.S. in Computer Science',
    graduation_year: payload.graduation_year || 2026,
    gpa: payload.gpa || 3.8,
    gpa_scale: 4.0,
    profile_confirmed: Boolean(payload.profile_confirmed),
    skills: payload.skills || [],
    projects: payload.projects || [],
    experiences: payload.experiences || [],
    created_at: now,
    updated_at: now,
  };
}

function classifySkillGap(currentLevel, targetLevel) {
  const gap = targetLevel - currentLevel;
  if (gap <= 0) return 'strong';
  if (gap === 1) return 'developing';
  return 'critical';
}

describe('Entity CRUD & Profile Domain Logic Suite', () => {
  test('createStudentProfile assigns unique UUID and sets timestamps', () => {
    const p1 = createStudentProfile({ full_name: 'Talha', email: 'talha@uni.edu' });
    const p2 = createStudentProfile({ full_name: 'Sara', email: 'sara@uni.edu' });

    assert.notStrictEqual(p1.id, p2.id);
    assert.strictEqual(p1.full_name, 'Talha');
    assert.strictEqual(p2.full_name, 'Sara');
    assert.strictEqual(typeof p1.created_at, 'string');
    assert.strictEqual(p1.skills.length, 0);
  });

  test('Skill gap classification categorizes based on gap magnitude', () => {
    assert.strictEqual(classifySkillGap(4, 4), 'strong'); // gap = 0
    assert.strictEqual(classifySkillGap(5, 4), 'strong'); // gap = -1
    assert.strictEqual(classifySkillGap(3, 4), 'developing'); // gap = 1
    assert.strictEqual(classifySkillGap(2, 4), 'critical'); // gap = 2
    assert.strictEqual(classifySkillGap(1, 4), 'critical'); // gap = 3
  });

  test('Project complexity score stays within standard 1 to 5 scale', () => {
    const computeComplexity = (techCount, hasHighlights, hasUrl) => {
      let score = Math.min(3, Math.max(1, Math.floor(techCount / 2)));
      if (hasHighlights) score += 1;
      if (hasUrl) score += 1;
      return Math.min(5, Math.max(1, score));
    };

    assert.strictEqual(computeComplexity(2, false, false), 1);
    assert.strictEqual(computeComplexity(5, true, true), 4);
    assert.strictEqual(computeComplexity(10, true, true), 5);
  });

  test('Experience duration months calculates total career tenure', () => {
    const experiences = [
      { title: 'Intern', duration_months: 3 },
      { title: 'Fellow', duration_months: 6 },
    ];
    const totalTenure = experiences.reduce((acc, exp) => acc + (exp.duration_months || 0), 0);
    assert.strictEqual(totalTenure, 9);
  });
});
