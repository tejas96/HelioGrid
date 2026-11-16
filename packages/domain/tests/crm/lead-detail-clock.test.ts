import { describe, expect, it } from 'vitest';
import { leadActDaysOf, tenantInstantOf } from '../../src/crm/lead-detail-clock';

describe('lead detail: the days its acts name, on the tenant clock (F1-10, M02-51)', () => {
  it.each([
    ['2026-11-09T18:29:00Z', '2026-11-09', '2026-11-10'],
    ['2026-11-09T18:30:00Z', '2026-11-10', '2026-11-11'],
    ['2026-12-31T20:00:00Z', '2027-01-01', '2027-01-02'],
  ])('at %s Kolkata reads today %s and tomorrow %s', (instant, today, tomorrow) => {
    expect(leadActDaysOf(Date.parse(instant), 'Asia/Kolkata')).toMatchObject({ today, tomorrow });
  });

  it.each([
    ['2026-11-12T04:00:00Z', '2026-11-19', '2026-12-12', '2027-02-12'],
    ['2026-11-09T18:30:00Z', '2026-11-17', '2026-12-10', '2027-02-10'],
    ['2026-10-31T06:00:00Z', '2026-11-07', '2026-11-30', '2027-01-31'],
    ['2026-11-30T06:00:00Z', '2026-12-07', '2026-12-30', '2027-02-28'],
  ])(
    'a loss postponed at %s Kolkata comes back in a week %s, a month %s or three months %s (M02-54)',
    (instant, week, month, threeMonths) => {
      expect(leadActDaysOf(Date.parse(instant), 'Asia/Kolkata').postpone).toEqual({
        week,
        month,
        threeMonths,
      });
    },
  );

  it.each([
    ['2026-11-14', '11:30', 'Asia/Kolkata', '2026-11-14T06:00:00.000Z'],
    ['2026-11-14', '00:00', 'Asia/Kolkata', '2026-11-13T18:30:00.000Z'],
    ['2026-11-14', '09:00', 'UTC', '2026-11-14T09:00:00.000Z'],
  ])('a call-back on %s at %s in %s is due at %s', (date, time, zone, due) => {
    expect(new Date(tenantInstantOf(date, time, zone)).toISOString()).toBe(due);
  });
});
