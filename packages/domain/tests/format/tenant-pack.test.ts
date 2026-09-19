import { describe, expect, it } from 'vitest';
import { formatDate, formatMonthYear } from '../../src/format/datetime';
import { IN_FORMATS } from '../../src/format/pack';
import { packOnTenantTime } from '../../src/format/tenant-pack';

/**
 * `F3-22` — a user-facing date renders on the TENANT's timezone. The pack ships the market's
 * default (`F1-10`), and a tenant that sets its own must be read by, not merely stored.
 *
 * The failure this catches is silent by construction: every date still renders, in the right
 * style, off by one day for exactly the tenants who set a zone of their own.
 */

/** 19:00 UTC — still 11 March in London, already 12 March in Kolkata. */
const ACROSS_MIDNIGHT = '2026-03-11T19:00:00Z';

describe('packOnTenantTime — the tenant is read by its own clock', () => {
  it('substitutes the tenant zone and changes nothing else', () => {
    const pack = packOnTenantTime(IN_FORMATS, 'Europe/London');
    expect(pack.timeZone).toBe('Europe/London');
    expect({ ...pack, timeZone: IN_FORMATS.timeZone }).toEqual(IN_FORMATS);
  });

  it('moves a date across midnight that the market default left where it was', () => {
    expect(formatDate(IN_FORMATS, ACROSS_MIDNIGHT)).toBe('12 Mar 2026');
    expect(formatDate(packOnTenantTime(IN_FORMATS, 'Europe/London'), ACROSS_MIDNIGHT)).toBe(
      '11 Mar 2026',
    );
  });

  it('moves a calendar heading with it, so no surface reads two months', () => {
    const newYear = '2026-01-01T00:30:00+05:30';
    expect(formatMonthYear(IN_FORMATS, newYear)).toBe('January 2026');
    expect(formatMonthYear(packOnTenantTime(IN_FORMATS, 'Europe/London'), newYear)).toBe(
      'December 2025',
    );
  });

  it('hands back the pack itself when the tenant runs on the market default', () => {
    expect(packOnTenantTime(IN_FORMATS, IN_FORMATS.timeZone)).toBe(IN_FORMATS);
  });

  it('keeps the market default rather than rendering in the device zone for an unusable zone', () => {
    expect(packOnTenantTime(IN_FORMATS, 'Mars/Olympus').timeZone).toBe(IN_FORMATS.timeZone);
    expect(packOnTenantTime(IN_FORMATS, '').timeZone).toBe(IN_FORMATS.timeZone);
  });
});
