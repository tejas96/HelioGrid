import { describe, expect, it } from 'vitest';
import { dueSinceOf, moneyDueGroupOf, type StageArrival } from '../../src/payments/due';

const at = (to: StageArrival['to'], when: number): StageArrival => ({ to, at: when });

describe('dueSinceOf — due when the project reaches the stage (M11-11, ruling 2026-11-10)', () => {
  it.each([
    ['not reached yet', 'installation', [at('won', 1), at('material_ordered', 2)], false, null],
    ['reached', 'installation', [at('won', 1), at('installation', 4)], false, 4],
    ['the stage before', 'installation', [at('won', 1), at('dispatched', 3)], false, null],
    ['due at won, from the first move', 'won', [at('won', 1)], false, 1],
    [
      'a skipped stage is passed (M11-12)',
      'incentive_claimed',
      [at('commissioned', 7), at('handed_over', 9)],
      false,
      9,
    ],
    [
      'a move back takes it away while nobody asked or paid',
      'installation',
      [at('installation', 4), at('dispatched', 5)],
      false,
      null,
    ],
    [
      'a move back keeps it due once it was asked for or paid',
      'installation',
      [at('installation', 4), at('dispatched', 5)],
      true,
      4,
    ],
    [
      'reached again after a move back counts from the second time',
      'installation',
      [at('installation', 4), at('dispatched', 5), at('installation', 6)],
      false,
      6,
    ],
    ['a cancel keeps what was owed (M11-50)', 'won', [at('won', 1), at('cancelled', 8)], false, 1],
    ['a cancel makes nothing due', 'installation', [at('won', 1), at('cancelled', 8)], false, null],
    ['no history', 'won', [], false, null],
  ] as const)('%s', (_, stage, arrivals, held, since) => {
    expect(dueSinceOf(stage, arrivals, held)).toBe(since);
  });
});

describe('moneyDueGroupOf — where a waiting part sits on Money due (M11-54)', () => {
  it.each([
    ['fell due today, nothing paid: due', 'due', '2026-11-12', 'due'],
    ['fell due yesterday: late from the day after it fell due', 'due', '2026-11-11', 'late'],
    ['fell due a month ago: late', 'due', '2026-10-12', 'late'],
    ['part paid, today: part received', 'part_received', '2026-11-12', 'part'],
    ['part paid, long ago: still part received', 'part_received', '2026-10-01', 'part'],
  ] as const)('%s', (_, state, dueOn, group) => {
    expect(moneyDueGroupOf(state, dueOn, '2026-11-12')).toBe(group);
  });
});
