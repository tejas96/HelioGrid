import { describe, expect, it } from 'vitest';
import { basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';
import { type ScheduleTerm, splitSchedule } from '../../src/payments/schedule';

const term = (share: number, dueOnStage: ScheduleTerm['dueOnStage'] = 'won'): ScheduleTerm => ({
  label: `${share / 100}%`,
  share: basisPoints(share),
  dueOnStage,
});

describe('splitSchedule — the parts add up to the payable exactly (M11-08, M11-13)', () => {
  it.each([
    ['40/50/10 of ₹3,00,000', 30_000_000, [4000, 5000, 1000], [12_000_000, 15_000_000, 3_000_000]],
    [
      'thirds of ₹1.00 — the last part takes the left-over paisa',
      100,
      [3333, 3333, 3334],
      [33, 33, 34],
    ],
    ['one part takes it all', 1_234_567, [10_000], [1_234_567]],
    ['a part that rounds up leaves the last part short', 101, [5050, 4950], [51, 50]],
    ['a zero payable', 0, [5000, 5000], [0, 0]],
  ] as const)('%s', (_, payable, shares, amounts) => {
    const parts = splitSchedule(
      minorUnits(payable),
      shares.map((share) => term(share)),
    );
    expect(parts.map((part) => part.amount)).toEqual(amounts);
    expect(parts.reduce((sum, part) => sum + part.amount, 0)).toBe(payable);
  });

  it('keeps each term as written beside its amount', () => {
    const [part] = splitSchedule(minorUnits(500), [term(10_000, 'installation')]);
    expect(part).toEqual({ label: '100%', share: 10_000, dueOnStage: 'installation', amount: 500 });
  });

  it('makes no parts from no terms — the schedule is absent, not invented (M11-15)', () => {
    expect(splitSchedule(minorUnits(500), [])).toEqual([]);
  });

  it.each([
    ['under the whole', [4000, 5000]],
    ['over the whole', [6000, 5000]],
  ])('refuses terms %s', (_, shares) => {
    expect(() =>
      splitSchedule(
        minorUnits(500),
        shares.map((share) => term(share)),
      ),
    ).toThrow(RangeError);
  });
});
