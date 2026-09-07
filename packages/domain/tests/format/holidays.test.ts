import { describe, expect, it } from 'vitest';
import { holidaysInForce, isHoliday } from '../../src/format/holidays';
import { IN_FORMATS } from '../../src/format/pack';

describe('the market holiday calendar (F1-48)', () => {
  it('is authored EMPTY for India — we supply no holiday of our own', () => {
    expect(IN_FORMATS.holidayCalendar).toEqual([]);
  });

  it('leaves the tenant its whole list, with nothing of ours mixed in (M01-59)', () => {
    expect(holidaysInForce(IN_FORMATS.holidayCalendar, ['2026-08-15', '2026-11-08'])).toEqual([
      '2026-08-15',
      '2026-11-08',
    ]);
  });
});

describe('holidaysInForce — the tenant adds and never subtracts (F1-17)', () => {
  it('keeps a market day the tenant did not declare', () => {
    expect(holidaysInForce(['2026-01-26'], [])).toEqual(['2026-01-26']);
  });

  it('collapses a day the tenant re-declares rather than counting it twice', () => {
    expect(holidaysInForce(['2026-01-26'], ['2026-01-26'])).toEqual(['2026-01-26']);
  });

  it('returns the union sorted, so a picker and a gate read the same order', () => {
    expect(holidaysInForce(['2026-03-25'], ['2026-01-26'])).toEqual(['2026-01-26', '2026-03-25']);
  });

  it('reads a tenant day as a holiday and an ordinary day as not one', () => {
    const inForce = holidaysInForce(IN_FORMATS.holidayCalendar, ['2026-10-20']);
    expect(isHoliday(inForce, '2026-10-20')).toBe(true);
    expect(isHoliday(inForce, '2026-10-21')).toBe(false);
  });
});

describe('the OTP destination allowlist (F1-49)', () => {
  it('carries +91 and nothing else — another country is a pack revision, not a release', () => {
    expect(IN_FORMATS.otpDestinationDialCodes).toEqual(['+91']);
  });
});
