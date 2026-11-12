import { describe, expect, it } from 'vitest';
import { needsYouKindsOf } from '../../src/dashboards/needs-you';

const none = {
  unassigned: 0,
  paymentsLate: 0,
  blockedOnUs: 0,
  waitingLongest: 0,
  myOverdueTasks: 0,
};

describe('needsYouKindsOf — fixed order, zeros left out (M13-15)', () => {
  it.each([
    [none, []],
    [{ ...none, myOverdueTasks: 2, unassigned: 1 }, ['unassigned', 'my_overdue_tasks']],
    [
      { unassigned: 1, paymentsLate: 3, blockedOnUs: 1, waitingLongest: 3, myOverdueTasks: 1 },
      ['unassigned', 'payments_late', 'blocked_on_us', 'waiting_longest', 'my_overdue_tasks'],
    ],
    [{ ...none, waitingLongest: 1 }, ['waiting_longest']],
  ])('%o → %o', (counts, kinds) => {
    expect(needsYouKindsOf(counts)).toEqual(kinds);
  });
});
