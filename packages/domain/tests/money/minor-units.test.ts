import { describe, expect, it } from 'vitest';
import { minorUnits, sumMinorUnits } from '../../src/money/minor-units';

describe('minorUnits — a whole number of the currency minor unit (F1-07)', () => {
  it.each([[0], [1], [-1], [Number.MAX_SAFE_INTEGER]])('accepts %d', (amount) => {
    expect(minorUnits(amount)).toBe(amount);
  });

  it.each([
    [0.5],
    [-0.01],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
    [Number.MAX_SAFE_INTEGER + 1],
  ])('refuses %o — a fraction of a paisa or an unsafe integer is an authoring error', (amount) => {
    expect(() => minorUnits(amount)).toThrow(RangeError);
  });
});

describe('sumMinorUnits — a total is the sum of its parts (M11-08)', () => {
  it.each([
    [[], 0],
    [[5], 5],
    [[1, 2, 3], 6],
    [[10, -4], 6],
  ])('%j sums to %d', (amounts, expected) => {
    expect(sumMinorUnits(amounts.map(minorUnits))).toBe(expected);
  });

  it('refuses a total past the safe range rather than losing a paisa', () => {
    const parts = [minorUnits(Number.MAX_SAFE_INTEGER), minorUnits(1)];
    expect(() => sumMinorUnits(parts)).toThrow(RangeError);
  });
});
