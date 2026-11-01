import { describe, expect, it } from 'vitest';
import { scaledPower } from '../../src/format/power';

describe('scaledPower — a design ceiling in the unit a reader says it in (SCR-M12-01)', () => {
  it.each([
    { kw: 0, want: { amount: 0, unit: 'kW' } },
    { kw: 50, want: { amount: 50, unit: 'kW' } },
    { kw: 999, want: { amount: 999, unit: 'kW' } },
    { kw: 1_000, want: { amount: 1, unit: 'MW' } },
    { kw: 1_500, want: { amount: 1_500, unit: 'kW' } },
    { kw: 5_000, want: { amount: 5, unit: 'MW' } },
    { kw: 100_000, want: { amount: 100, unit: 'MW' } },
  ])('$kw kW reads $want.amount $want.unit', ({ kw, want }) => {
    expect(scaledPower(kw)).toEqual(want);
  });
});
