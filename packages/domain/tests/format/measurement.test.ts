import { describe, expect, it } from 'vitest';
import {
  formatLength,
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
    expect(PROCUREMENT_SYSTEM).toBe('metric');
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
