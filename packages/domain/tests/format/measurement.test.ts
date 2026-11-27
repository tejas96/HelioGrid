import { describe, expect, it } from 'vitest';
import {
  feetAndInches,
  formatArea,
  formatLength,
  formatRoofHeight,
  formatRoofLength,
  formatRoofSlope,
  metresOfFeetAndInches,
  PROCUREMENT_SYSTEM,
  resolveMeasurementSystem,
} from '../../src/format/measurement';
import { type FormatPack, IN_FORMATS } from '../../src/format/pack';

/** NON-BREAKING space — a value and its unit never separate (`F3-08`). */
const NBSP = ' ';

const IMPERIAL_MARKET: FormatPack = { ...IN_FORMATS, measurementSystem: 'imperial' };

describe('procurement is metric for every user (F3-23)', () => {
  it('is a constant, not a preference', () => {
    /* A supplier order in feet is a wrong order, so no caller may vary this. */
    expect(formatLength(IMPERIAL_MARKET, 4.2, PROCUREMENT_SYSTEM)).toBe(`4.2${NBSP}m`);
  });
});

describe('resolveMeasurementSystem — the user first, then the market', () => {
  it.each([
    [IN_FORMATS, undefined, 'metric'],
    [IN_FORMATS, 'imperial' as const, 'imperial'],
    [IMPERIAL_MARKET, undefined, 'imperial'],
    [IMPERIAL_MARKET, 'metric' as const, 'metric'],
  ])('pack %# with preference %o → %s', (pack, preference, expected) => {
    expect(resolveMeasurementSystem(pack, preference)).toBe(expected);
  });
});

describe('formatLength — metres in, the reader’s system out', () => {
  it('defaults to the market', () => {
    expect(formatLength(IN_FORMATS, 4.2)).toBe(`4.2${NBSP}m`);
    expect(formatLength(IMPERIAL_MARKET, 4.2)).toBe(`13.8${NBSP}ft`);
  });

  it('converts on request without touching what is stored', () => {
    expect(formatLength(IN_FORMATS, 1, 'imperial')).toBe(`3.3${NBSP}ft`);
    expect(formatLength(IN_FORMATS, 0)).toBe(`0${NBSP}m`);
    expect(formatLength(IN_FORMATS, -1.5)).toBe(`-1.5${NBSP}m`);
  });
});

describe('a roof’s lengths and area (T-M05-002)', () => {
  it.each([
    // metres, system, traced → shown
    // One digit count for every length on the roof step: the "~" alone says it is from the picture.
    [7.84, 'metric', true, `~7.84${NBSP}m`],
    [8, 'metric', true, `~8.00${NBSP}m`],
    [28.98, 'metric', true, `~28.98${NBSP}m`],
    [8.2, 'metric', false, `8.20${NBSP}m`],
    [400, 'metric', false, `400.00${NBSP}m`],
    [8.204, 'imperial', false, `26${NBSP}ft 11${NBSP}in`],
    [8.0, 'imperial', true, `~26${NBSP}ft 3${NBSP}in`],
    // 11.6 in rounds up into the next foot, never "12 in".
    [0.3 * 3 + 0.3, 'imperial', false, `3${NBSP}ft 11${NBSP}in`],
    [0.9144 - 0.0001, 'imperial', false, `3${NBSP}ft 0${NBSP}in`],
  ] as const)('%s m, %s, traced %s: %s', (metres, system, traced, shown) => {
    expect(formatRoofLength(IN_FORMATS, metres, system, traced)).toBe(shown);
  });

  it.each([
    [3, 'metric', `3.0${NBSP}m`],
    [4.5, 'metric', `4.5${NBSP}m`],
    [3.25, 'metric', `3.25${NBSP}m`],
    [3, 'imperial', `9${NBSP}ft 10${NBSP}in`],
  ] as const)('a height of %s m, %s: %s', (metres, system, shown) => {
    expect(formatRoofHeight(IN_FORMATS, metres, system)).toBe(shown);
  });

  it.each([
    [30, 'metric', '30°'],
    [6.5, 'metric', '6.5°'],
    [0, 'metric', '0°'],
    [14, 'imperial', '3/12 · 14°'],
    [45, 'imperial', '12/12 · 45°'],
    [6, 'imperial', '1.3/12 · 6°'],
    [0, 'imperial', '0/12 · 0°'],
  ] as const)('a slope of %s°, %s: %s', (degrees, system, shown) => {
    expect(formatRoofSlope(IN_FORMATS, degrees, system)).toBe(shown);
  });

  it.each([
    [26, 11, 8.2042],
    [0, 12, 0.3048],
    [3, 0, 0.9144],
  ])('%s ft %s in is %s m', (feet, inches, metres) => {
    expect(metresOfFeetAndInches(feet, inches)).toBeCloseTo(metres, 4);
  });

  it.each([
    [8.2042, { feet: 26, inches: 11 }],
    [0.9144 - 0.005, { feet: 3, inches: 0 }],
    [0, { feet: 0, inches: 0 }],
  ])('%s m is %o', (metres, parts) => {
    expect(feetAndInches(metres)).toEqual(parts);
  });

  it.each([
    [65.6, 'metric', `66${NBSP}m²`],
    [65.6, 'imperial', `706${NBSP}sq ft`],
    [1234.4, 'metric', `1,234${NBSP}m²`],
  ] as const)('an area of %s m², %s: %s', (squareMetres, system, shown) => {
    expect(formatArea(IN_FORMATS, squareMetres, system)).toBe(shown);
  });
});
