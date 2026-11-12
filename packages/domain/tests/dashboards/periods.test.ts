import { describe, expect, it } from 'vitest';
import { readsCompanyWide } from '../../src/dashboards/company-wide';
import { summaryMonthDue, winRateWindowStart } from '../../src/dashboards/periods';

const IST = 'Asia/Kolkata';
const at = (iso: string) => Date.parse(iso);

describe('summaryMonthDue — the first of a month, from 09:00 company time (M13-21)', () => {
  it.each([
    ['08:59 on the 1st', '2026-12-01T03:29:00Z', null],
    ['09:00 on the 1st', '2026-12-01T03:30:00Z', '2026-11'],
    ['late on the 1st', '2026-12-01T18:00:00Z', '2026-11'],
    ['the 2nd', '2026-12-01T18:31:00Z', null],
    ['January the 1st', '2027-01-01T04:00:00Z', '2026-12'],
    ['the 15th', '2026-12-15T05:00:00Z', null],
  ])('%s → %s', (_case, now, month) => {
    expect(summaryMonthDue(at(now), IST)).toBe(month);
  });
});

describe('winRateWindowStart — company midnight, 90 days back (M13-23)', () => {
  it('starts at local midnight', () => {
    expect(new Date(winRateWindowStart(at('2026-11-12T06:00:00Z'), IST)).toISOString()).toBe(
      '2026-08-13T18:30:00.000Z',
    );
  });
});

describe('readsCompanyWide — the company target and summary are company-wide readers only (M13-07)', () => {
  it.each([
    [['epc_owner'], true],
    [['sales_manager'], false],
    [['sales_manager', 'epc_owner'], true],
    [['sales_executive'], false],
    [[], false],
  ] as const)('%o → %s', (roles, wide) => {
    expect(readsCompanyWide(roles)).toBe(wide);
  });
});
