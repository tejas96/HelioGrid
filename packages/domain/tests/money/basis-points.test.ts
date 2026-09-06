import { describe, expect, it } from 'vitest';
import { applyRate, basisPoints } from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';

describe('basisPoints — a rate as whole basis points, 1800 for 18%', () => {
  it.each([[0], [25], [1800], [10_000]])('accepts %d', (rate) => {
    expect(basisPoints(rate)).toBe(rate);
  });

  it.each([[-1], [10_001], [18.5], [Number.NaN]])('refuses %o', (rate) => {
    expect(() => basisPoints(rate)).toThrow(RangeError);
  });
});

describe('applyRate — rounds once, at the minor unit, half away from zero (Q83)', () => {
  it.each([
    [100_000, 1800, 18_000],
    [100_001, 1800, 18_000],
    [100_003, 1800, 18_001],
    [1, 5000, 1],
    [1, 4999, 0],
    [5, 5000, 3],
    [-5, 5000, -3],
    [-1, 4999, 0],
    [0, 1800, 0],
    [100_000, 0, 0],
    [100_000, 10_000, 100_000],
    [Number.MAX_SAFE_INTEGER, 10_000, Number.MAX_SAFE_INTEGER],
  ])('%d at %d bps is %d', (amount, rate, expected) => {
    expect(applyRate(minorUnits(amount), basisPoints(rate))).toBe(expected);
  });

  it.each([
    [100_000, 1800, { parts: 1, ofParts: 2 }, 9_000],
    [1, 10_000, { parts: 1, ofParts: 2 }, 1],
    [100_000, 1800, { parts: 2, ofParts: 3 }, 12_000],
    [1000, 1800, { parts: 1, ofParts: 3 }, 60],
  ])('%d at %d bps taking share %o is %d', (amount, rate, share, expected) => {
    expect(applyRate(minorUnits(amount), basisPoints(rate), share)).toBe(expected);
  });
});
