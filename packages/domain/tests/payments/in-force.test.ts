import { describe, expect, it } from 'vitest';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { type KeptPart, scheduleInForce } from '../../src/payments/in-force';
import type { ScheduleTerm } from '../../src/payments/schedule';

const term = (label: string, share: number): ScheduleTerm => ({
  label,
  share: basisPoints(share),
  dueOnStage: 'won',
});
const PLAN = [
  term('Advance', 1000),
  term('Material', 6000),
  term('Installation', 2000),
  term('Handover', 1000),
];
/** A hundred paise shared three ways leaves one paisa over. */
const ONE_RUPEE = 100;
const THIRD = 33;
const paid = (amount: number): KeptPart => ({
  amount: minorUnits(amount),
  floor: minorUnits(amount),
});
const partPaid = (amount: number, received: number): KeptPart => ({
  amount: minorUnits(amount),
  floor: minorUnits(received),
});

describe('scheduleInForce — paid parts stay, the rest is split by the new plan (M08-50, M11-14)', () => {
  it.each([
    [
      'the advance is paid: the three parts after it share what is left, 60:20:10',
      30_500_000,
      [paid(1_905_750)],
      1_905_750,
      { kept: [1_905_750], parts: [19_062_833, 6_354_278, 3_177_139], remaining: 28_594_250 },
    ],
    [
      'nothing is paid: the whole new plan stands',
      30_500_000,
      [],
      0,
      { kept: [], parts: [3_050_000, 18_300_000, 6_100_000, 3_050_000], remaining: 30_500_000 },
    ],
    [
      'a part-paid part keeps its amount; the rest follows it',
      10_000_000,
      [paid(1_000_000), partPaid(6_000_000, 2_000_000)],
      3_000_000,
      { kept: [1_000_000, 6_000_000], parts: [2_000_000, 1_000_000], remaining: 7_000_000 },
    ],
    [
      'every part of the new plan is already stood in for: its last part takes the rest',
      10_000_000,
      [paid(1_000_000), paid(2_000_000), paid(3_000_000), paid(1_000_000)],
      7_000_000,
      {
        kept: [1_000_000, 2_000_000, 3_000_000, 1_000_000],
        parts: [3_000_000],
        remaining: 3_000_000,
      },
    ],
    [
      'the kept parts already ask the whole new total: nothing new is asked',
      3_000_000,
      [paid(1_000_000), paid(2_000_000)],
      3_000_000,
      { kept: [1_000_000, 2_000_000], parts: [], remaining: 0 },
    ],
  ] as const)('%s', (_, total, kept, collected, expected) => {
    const made = scheduleInForce(minorUnits(total), PLAN, kept, minorUnits(collected));
    expect(made.kept).toEqual(expected.kept);
    expect(made.parts.map((part) => part.amount)).toEqual(expected.parts);
    expect(made.remaining).toBe(expected.remaining);
    expect(made.surplus).toBeNull();
    const asked = [...made.kept, ...made.parts.map((part) => part.amount)];
    expect(asked.reduce((sum, amount) => sum + amount, 0)).toBe(total);
  });

  it('a smaller total lowers a part-paid part to fit, never under what it received', () => {
    const made = scheduleInForce(
      minorUnits(5_000_000),
      PLAN,
      [paid(1_000_000), partPaid(6_000_000, 2_000_000)],
      minorUnits(3_000_000),
    );
    expect(made.kept).toEqual([1_000_000, 4_000_000]);
    expect(made.parts).toEqual([]);
    expect(made.remaining).toBe(2_000_000);
    expect(made.surplus).toBeNull();
  });

  it.each([
    ['one paisa past the new total', 3_000_001, 1],
    ['well past it', 4_500_000, 1_500_000],
  ])('more collected than the new total is a surplus, stated — %s', (_, collected, surplus) => {
    const made = scheduleInForce(
      minorUnits(3_000_000),
      PLAN,
      [paid(collected)],
      minorUnits(collected),
    );
    expect(made.kept).toEqual([collected]);
    expect(made.parts).toEqual([]);
    expect(made.remaining).toBe(0);
    expect(made.surplus).toBe(surplus);
  });

  it('exactly the new total collected is no surplus', () => {
    const made = scheduleInForce(
      minorUnits(3_000_000),
      PLAN,
      [paid(3_000_000)],
      minorUnits(3_000_000),
    );
    expect(made.surplus).toBeNull();
    expect(made.remaining).toBe(0);
  });

  it('keeps each new part as its term wrote it', () => {
    const made = scheduleInForce(minorUnits(1_000), [term('Only', 10_000)], [], minorUnits(0));
    expect(made.parts).toEqual([
      { label: 'Only', share: 10_000, dueOnStage: 'won', amount: 1_000 },
    ]);
  });

  it('the last new part takes the minor unit rounding leaves over, so the parts sum to the total', () => {
    const thirds = [term('A', 1), term('B', 1), term('C', 1)];
    const split = scheduleInForce(minorUnits(ONE_RUPEE), thirds, [], minorUnits(0));
    expect(split.parts.map((part) => part.amount)).toEqual([THIRD, THIRD, THIRD + 1]);
  });

  it('parts with no share between them ask nothing but the last, which takes the rest', () => {
    const made = scheduleInForce(minorUnits(900), [term('A', 0), term('B', 0)], [], minorUnits(0));
    expect(made.parts.map((part) => part.amount)).toEqual([0, 900]);
  });

  it('refuses to share out a remainder with no plan at all', () => {
    expect(() => scheduleInForce(minorUnits(500), [], [], minorUnits(0))).toThrow(RangeError);
  });
});
