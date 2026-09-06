import { describe, expect, it } from 'vitest';
import { amountForQuantity, minorUnits, sumMinorUnits } from '../../src/money/minor-units';

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

describe('amountForQuantity — a quantity at a per-unit amount, rounded once (Q83)', () => {
  it.each([
    [100, 0, 0],
    [100, 1, 100],
    [100, 2.5, 250],
    [-100, 2.5, -250],
    [3_000_000, 0.5, 1_500_000],
  ])('%d per unit × %d units is %d', (perUnit, quantity, expected) => {
    expect(amountForQuantity(minorUnits(perUnit), quantity)).toBe(expected);
  });

  it.each([
    [1, 0.5, 1],
    [1, 1.5, 2],
    [1, 2.5, 3],
    [-1, 0.5, -1],
  ])('%d × %d rounds half AWAY from zero to %d', (perUnit, quantity, expected) => {
    expect(amountForQuantity(minorUnits(perUnit), quantity)).toBe(expected);
  });

  it('rounds the float away rather than carrying it into the sum above', () => {
    expect(amountForQuantity(minorUnits(3_000_000), 2.7)).toBe(8_100_000);
  });

  it.each([[-1], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    'refuses a quantity of %o',
    (quantity) => {
      expect(() => amountForQuantity(minorUnits(100), quantity)).toThrow(RangeError);
    },
  );
});
