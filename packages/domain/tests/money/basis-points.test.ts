import { describe, expect, it } from 'vitest';
import {
  amountBeforeRate,
  applyRate,
  basisPoints,
  basisPointsOfShare,
  basisPointsToPercent,
  percentToBasisPoints,
  percentWireOf,
  proportionOf,
  shareOfBasisPoints,
  shareTextOf,
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

describe('a share as a field holds it and as a person reads it', () => {
  it.each([
    { share: 0.01, rate: 1, text: '0.01' },
    { share: 10, rate: 1000, text: '10' },
    { share: 33.33, rate: 3333, text: '33.33' },
    { share: 0.1 + 0.2, rate: 30, text: '0.3' },
    { share: 100, rate: 10_000, text: '100' },
  ])('$share is $rate basis points, read $text', ({ share, rate, text }) => {
    expect(basisPointsOfShare(share)).toBe(rate);
    expect(shareOfBasisPoints(rate)).toBe(Number(text));
    expect(shareTextOf(rate)).toBe(text);
  });
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

describe('proportionOf — a part of an amount, rounded once', () => {
  it.each([
    ['two thirds of ₹10,000.01', 1_000_001, 2, 3, 666_667],
    ['one third of it', 1_000_001, 1, 3, 333_334],
    ['the whole', 500, 7, 7, 500],
    ['none of it', 500, 0, 7, 0],
    ['half a paisa rounds away from zero', 1, 1, 2, 1],
    ['a credit rounds away from zero too', -1, 1, 2, -1],
  ])('%s', (_, amount, parts, ofParts, part) => {
    expect(proportionOf(minorUnits(amount), { parts, ofParts })).toBe(part);
  });
});

describe('amountBeforeRate — a figure typed including its rate (M06-09)', () => {
  it.each([
    ['₹1,90,575 at 8.9% is ₹1,75,000 before it', 19_057_500, 890, 17_500_000],
    ['₹118 at 18% is ₹100', 11_800, 1800, 10_000],
    ['no rate: the figure itself', 12_345, 0, 12_345],
    ['₹100 at 18% is ₹84.75, rounded once', 10_000, 1800, 8_475],
    ['a figure of nothing', 0, 890, 0],
    ['a rate of the whole halves it', 1_000, 10_000, 500],
  ])('%s', (_, inclusive, rate, before) => {
    expect(amountBeforeRate(minorUnits(inclusive), basisPoints(rate))).toBe(before);
  });
});
