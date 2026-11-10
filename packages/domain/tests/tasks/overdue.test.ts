import { describe, expect, it } from 'vitest';
import { isOverdue } from '../../src/tasks/overdue';

const NOW = Date.parse('2026-11-09T06:00:00Z');
const DAY = 24 * 60 * 60 * 1_000;

describe('overdue is derived, never stored (M07-05)', () => {
  it('a task due yesterday is overdue until its due date moves to tomorrow', () => {
    const task = { status: 'open', dueAt: NOW - DAY } as const;
    expect(isOverdue(task, NOW)).toBe(true);
    expect(isOverdue({ ...task, dueAt: NOW + DAY }, NOW)).toBe(false);
  });

  it.each([
    ['open', -1, true],
    ['open', 0, false],
    ['open', 1, false],
    ['done', -DAY, false],
    ['cancelled', -DAY, false],
  ] as const)('a %s task due %i ms from now is overdue: %s', (status, offset, overdue) => {
    expect(isOverdue({ status, dueAt: NOW + offset }, NOW)).toBe(overdue);
  });
});
