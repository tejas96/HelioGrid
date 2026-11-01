import { describe, expect, it } from 'vitest';
import {
  REACTIVATION_PAGE_HOURS,
  reactivationPageExpiresAt,
  refundWindowClosesAt,
} from '../../src/commerce/cancellation';

const MS_PER_HOUR = 60 * 60 * 1_000;

describe('refundWindowClosesAt — the first cycle refunds through its seventh calendar day (M12-47)', () => {
  it.each([
    // Paid 12 Sept on the company's clock: open through 18 Sept, closed as 19 Sept begins.
    {
      zone: 'Asia/Kolkata',
      paidAt: '2026-09-12T10:00:00+05:30',
      closesAt: '2026-09-19T00:00:00+05:30',
    },
    // A minute after midnight is still day 1; a minute before is the day before.
    {
      zone: 'Asia/Kolkata',
      paidAt: '2026-09-12T00:00:00+05:30',
      closesAt: '2026-09-19T00:00:00+05:30',
    },
    {
      zone: 'Asia/Kolkata',
      paidAt: '2026-09-11T23:59:00+05:30',
      closesAt: '2026-09-18T00:00:00+05:30',
    },
    // The same UTC moment is 12 Sept in Kolkata and still 11 Sept in London: the company's clock.
    {
      zone: 'Europe/London',
      paidAt: '2026-09-11T23:30:00+01:00',
      closesAt: '2026-09-18T00:00:00+01:00',
    },
    // London leaves summer time on 25 Oct 2026: the window still closes at local midnight.
    {
      zone: 'Europe/London',
      paidAt: '2026-10-22T15:00:00+01:00',
      closesAt: '2026-10-29T00:00:00+00:00',
    },
    // And enters it on 29 Mar 2026.
    {
      zone: 'Europe/London',
      paidAt: '2026-03-26T09:00:00+00:00',
      closesAt: '2026-04-02T00:00:00+01:00',
    },
  ])('paid $paidAt in $zone closes $closesAt', ({ zone, paidAt, closesAt }) => {
    expect(new Date(refundWindowClosesAt(Date.parse(paidAt), zone)).toISOString()).toBe(
      new Date(Date.parse(closesAt)).toISOString(),
    );
  });
});

describe('reactivationPageExpiresAt — a dead row’s hosted page takes money for a day (M12-08)', () => {
  it.each([0, Date.parse('2026-10-25T00:30:00Z')])(
    'a page opened at %s closes 24 hours on',
    (openedAt) => {
      expect(reactivationPageExpiresAt(openedAt) - openedAt).toBe(
        REACTIVATION_PAGE_HOURS * MS_PER_HOUR,
      );
    },
  );
});
