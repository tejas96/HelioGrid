import { describe, expect, it } from 'vitest';
import {
  formatCompact,
  formatNumber,
  isRenderableNumber,
  parseNumber,
} from '../../src/format/number';
import { IN_FORMATS } from '../../src/format/pack';

/** A market that declares no compact ladder — the `F1-21` "may be empty" case. */
const NO_LADDER = { ...IN_FORMATS, compactSteps: [] };

describe('isRenderableNumber', () => {
  it.each([
    [null, false],
    [undefined, false],
    ['', false],
    ['abc', false],
    [Number.NaN, false],
    [0, true],
    ['0', true],
    [-1, true],
    /* Number(' ') is 0, not NaN. A whitespace-only string therefore RENDERS as zero. Pinned
       because it is the one case a reader guesses wrong, and a stray space in a CSV import
       becoming `₹0` is a money bug, not a formatting one. */
    [' ', true],
  ])('%o → %s', (value, expected) => {
    expect(isRenderableNumber(value)).toBe(expected);
  });
});

describe('formatNumber — the market groups, never the reader (F3-20)', () => {
  it.each([
    [452471, '4,52,471'],
    ['452471', '4,52,471'],
    [0, '0'],
    [-452471, '-4,52,471'],
    /* Default is one decimal place, so a long fraction is cut rather than printed whole. */
    [1.26, '1.3'],
  ])('%o → %s', (value, expected) => {
    expect(formatNumber(IN_FORMATS, value)).toBe(expected);
  });

  it('takes an explicit fraction range', () => {
    expect(formatNumber(IN_FORMATS, 1.26, { maximumFractionDigits: 2 })).toBe('1.26');
    expect(formatNumber(IN_FORMATS, 5, { minimumFractionDigits: 2 })).toBe('5.00');
  });

  it('renders nothing for a value that is not a number', () => {
    expect(formatNumber(IN_FORMATS, null)).toBe('');
  });
});

describe('formatCompact — the rungs and their edges (F1-46)', () => {
  it.each([
    /* Exactly ON each rung, and exactly one below it. The boundary is where a ladder breaks. */
    [1e7, '1 Cr'],
    [9_999_999, '100L'],
    [1e5, '1L'],
    [99_999, '99,999'],
    [9_200_000, '92L'],
    [14_000_000, '1.4 Cr'],
    [-9_200_000, '-92L'],
    [0, '0'],
    /* One decimal, and no trailing `.0` on a whole rung. */
    [15_500_000, '1.6 Cr'],
  ])('%o → %s', (value, expected) => {
    expect(formatCompact(IN_FORMATS, value)).toBe(expected);
  });

  it('falls back to plain grouping where a market declares no ladder', () => {
    expect(formatCompact(NO_LADDER, 9_200_000)).toBe('92,00,000');
  });

  it('renders nothing for a value that is not a number', () => {
    expect(formatCompact(IN_FORMATS, undefined)).toBe('');
  });
});

describe('parseNumber — a typed amount comes back a number', () => {
  it.each([
    ['₹4,52,471', 452471],
    ['4,52,471', 452471],
    ['-5', -5],
    ['1.5', 1.5],
    [42, 42],
  ])('%o → %o', (input, expected) => {
    expect(parseNumber(input)).toBe(expected);
  });

  it.each([[''], ['-'], ['abc'], ['12.3.4']])('%o → null', (input) => {
    expect(parseNumber(input)).toBeNull();
  });
});
