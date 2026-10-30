import type { BillingCycle } from '@heliogrid/domain';

/**
 * The end of the period a charge made at `startsAt` pays for, when the gateway names none — a
 * payment link pays for one cycle from the moment it is paid (`M12-54`: the paid cycle starts at
 * conversion). A calendar month or year on the UTC calendar; a day the next month lacks (31 Jan)
 * lands on that month's last day.
 */
const MONTHS_IN: Record<BillingCycle, number> = { monthly: 1, yearly: 12 };
const MONTHS_PER_YEAR = 12;

export function cycleEnd(startsAt: number, cycle: BillingCycle): number {
  const start = new Date(startsAt);
  const monthsAhead = start.getUTCMonth() + MONTHS_IN[cycle];
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
