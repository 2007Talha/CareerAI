import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Roadmap generator & milestone progression test suite.
 */
function generateRoadmapPhases(careerTitle, gapSkills) {
  const phases = [
    { phaseNumber: 1, title: 'Systems & Infrastructure', items: [] },
    { phaseNumber: 2, title: 'Scale & Reliability', items: [] },
    { phaseNumber: 3, title: 'AI Augmentation & Portfolio', items: [] },
  ];

  gapSkills.forEach((skill, idx) => {
    const phaseIndex = idx % 3;
    phases[phaseIndex].items.push({
      id: `milestone_${idx + 1}`,
      action_title: `Master ${skill.name}`,
      estimated_hours: 8 + idx * 2,
      is_completed: false,
    });
  });

  return phases;
}

function calculateRoadmapCompletion(items) {
  if (!items || items.length === 0) return 0;
  const completed = items.filter((item) => item.is_completed).length;
  return Math.round((completed / items.length) * 100);
}

describe('Roadmap Generator & Milestone Progression Suite', () => {
  test('Phased roadmap distributes skill gaps across chronological phases', () => {
    const gaps = [
      { name: 'Docker' },
      { name: 'Kubernetes' },
      { name: 'Redis' },
      { name: 'Kafka' },
      { name: 'Vector Search' },
    ];
    const phases = generateRoadmapPhases('Full-Stack Engineer', gaps);

    assert.strictEqual(phases.length, 3);
    assert.strictEqual(phases[0].items.length, 2); // items 0, 3
    assert.strictEqual(phases[1].items.length, 2); // items 1, 4
    assert.strictEqual(phases[2].items.length, 1); // item 2
  });

  test('Roadmap completion percentage calculates 0% for unstarted roadmap', () => {
    const items = [
      { id: '1', is_completed: false },
      { id: '2', is_completed: false },
    ];
    assert.strictEqual(calculateRoadmapCompletion(items), 0);
  });

  test('Roadmap completion percentage calculates 100% when all items completed', () => {
    const items = [
      { id: '1', is_completed: true },
      { id: '2', is_completed: true },
    ];
    assert.strictEqual(calculateRoadmapCompletion(items), 100);
  });

  test('Roadmap completion calculates accurate intermediate percentage', () => {
    const items = [
      { id: '1', is_completed: true },
      { id: '2', is_completed: true },
      { id: '3', is_completed: false },
      { id: '4', is_completed: false },
    ];
    assert.strictEqual(calculateRoadmapCompletion(items), 50);
  });

  test('Estimated hours summation calculates total timeline investment', () => {
    const items = [
      { estimated_hours: 10 },
      { estimated_hours: 15 },
      { estimated_hours: 5 },
    ];
    const totalHours = items.reduce((sum, item) => sum + (item.estimated_hours || 0), 0);
    assert.strictEqual(totalHours, 30);
  });
});
