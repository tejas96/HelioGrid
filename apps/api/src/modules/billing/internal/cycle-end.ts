import type { BillingCycle } from '@heliogrid/domain';

const MONTHS_IN: Record<BillingCycle, number> = { monthly: 1, yearly: 12 };
const MONTHS_PER_YEAR = 12;

/**
 * The end of the period a charge made at `startsAt` pays for, when the gateway names none — a
 * payment link pays for one cycle from the moment it is paid (`M12-54`: the paid cycle starts at
 * conversion), and a renewal from the end of the period before it.
 */
export function cycleEnd(startsAt: number, cycle: BillingCycle): number {
  return monthsAfter(startsAt, MONTHS_IN[cycle]);
}

/**
 * `months` calendar months after `anchor` on the UTC calendar, at the same time of day. A day the
 * month lacks (31 Jan + 1) lands on that month's last day; counting each step from the anchor,
 * never from the step before, keeps a 31st anchor on the 31st of every month that has one.
 */
export function monthsAfter(anchor: number, months: number): number {
  const start = new Date(anchor);
  const monthsAhead = start.getUTCMonth() + months;
  const year = start.getUTCFullYear() + Math.floor(monthsAhead / MONTHS_PER_YEAR);
  const month = monthsAhead % MONTHS_PER_YEAR;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Date.UTC(
    year,
    month,
    Math.min(start.getUTCDate(), lastDay),
    start.getUTCHours(),
    start.getUTCMinutes(),
    start.getUTCSeconds(),
    start.getUTCMilliseconds(),
  );
}
