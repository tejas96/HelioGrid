import { describe, expect, it } from 'vitest';
import {
  applyRate,
  basisPoints,
  basisPointsToPercent,
  percentToBasisPoints,
  percentWireOf,
} from '../../src/money/basis-points';
import { minorUnits } from '../../src/money/minor-units';

describe('basisPoints — a rate as whole basis points, 1800 for 18%', () => {
  it.each([[0], [25], [1800], [10_000]])('accepts %d', (rate) => {
    expect(basisPoints(rate)).toBe(rate);
  });

  it.each([[-1], [10_001], [18.5], [Number.NaN]])('refuses %o', (rate) => {
    expect(() => basisPoints(rate)).toThrow(RangeError);
  });
});

describe('applyRate — rounds once, at the minor unit, half away from zero', () => {
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

describe('percentToBasisPoints / basisPointsToPercent — the wire’s two-decimal percent, exactly', () => {
  it.each([
    ['0.00', 0],
    ['0.01', 1],
    ['10.00', 1000],
    ['33.33', 3333],
    ['100.00', 10_000],
  ])('%s is %d basis points and reads back the same', (percent, rate) => {
    expect(percentToBasisPoints(percent)).toBe(rate);
    expect(basisPointsToPercent(basisPoints(rate))).toBe(percent);
  });

  it.each([['100.01'], ['10'], ['10.0'], ['10.000'], ['-1.00'], ['abc'], ['']])(
    'refuses %o',
    (percent) => {
      expect(() => percentToBasisPoints(percent)).toThrow(RangeError);
    },
  );
});

describe("percentWireOf — a typed percent as the wire's two decimals", () => {
  it.each([
    ['5', '5.00'],
    ['5.5', '5.50'],
    ['5.25', '5.25'],
    [' 18 ', '18.00'],
    ['0', '0.00'],
    ['100', '100.00'],
    ['18.', '18.00'],
  ])('writes %j as %j', (typed, wire) => {
    expect(percentWireOf(typed)).toBe(wire);
  });

  it.each([['5.255'], ['-1'], ['1000'], ['abc'], ['']])(
    'leaves %j as typed, for the server to refuse',
    (typed) => {
      expect(percentWireOf(typed)).toBe(typed.trim());
    },
  );
});
