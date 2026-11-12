import { describe, expect, it } from 'vitest';
import { minorUnits } from '../../src/money/minor-units';
import { type PartMoney, projectMoneyOf, trancheStandingOf } from '../../src/payments/standing';

const facts = (amount: number, received: number, due: boolean, waived = false) => ({
  amount: minorUnits(amount),
  received: minorUnits(received),
  due,
  waived,
});

describe('trancheStandingOf — the state the facts imply, never typed (M11-10)', () => {
  it.each([
    ['nothing in, not due', 1000, 0, false, false, 'upcoming', 1000, 0],
    ['nothing in, due', 1000, 0, true, false, 'due', 1000, 0],
    ['one paisa in', 1000, 1, true, false, 'part_received', 999, 0],
    ['paid early, before it is due', 1000, 400, false, false, 'part_received', 600, 0],
    ['one paisa short', 1000, 999, true, false, 'part_received', 1, 0],
    ['exactly paid', 1000, 1000, true, false, 'received', 0, 0],
    [
      'paid over — the extra is stated, never moved (M11-36)',
      1000,
      1500,
      true,
      false,
      'received',
      0,
      500,
    ],
    ['reversed back to nothing (M11-48)', 1000, 0, true, false, 'due', 1000, 0],
    ['waived with nothing in (M11-49)', 1000, 0, true, true, 'waived', 0, 0],
    ['waived after a part payment', 1000, 300, true, true, 'waived', 0, 0],
  ] as const)('%s', (_, amount, received, due, waived, state, outstanding, extra) => {
    expect(trancheStandingOf(facts(amount, received, due, waived))).toEqual({
      state,
      outstanding,
      extra,
    });
  });
});

describe('projectMoneyOf — one figure each, whoever looks (M11-43)', () => {
  const part = (amount: number, received: number, due: boolean, waived = false): PartMoney => ({
    amount: minorUnits(amount),
    received: minorUnits(received),
    due,
    standing: trancheStandingOf(facts(amount, received, due, waived)),
  });

  it('splits what is owed into due now and still to come', () => {
    expect(
      projectMoneyOf([
        part(12_000, 12_000, true),
        part(15_000, 10_000, true),
        part(3_000, 0, false),
      ]),
    ).toEqual({ total: 30_000, collected: 22_000, toCollect: 5_000, next: 3_000 });
  });

  it('counts a waived part as neither collected nor owed', () => {
    expect(projectMoneyOf([part(1_000, 0, true, true)])).toEqual({
      total: 1_000,
      collected: 0,
      toCollect: 0,
      next: 0,
    });
  });

  it('is all zero for a project with no schedule (M11-15)', () => {
    expect(projectMoneyOf([])).toEqual({ total: 0, collected: 0, toCollect: 0, next: 0 });
  });
});
