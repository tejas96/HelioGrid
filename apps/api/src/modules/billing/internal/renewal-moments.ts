import { ENTITLEMENT_BUFFER_DAYS, MS_PER_DAY, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import type { UsageWindow } from '../usage.repository';
import { monthsAfter } from './cycle-end';

/**
 * A paid period cut into calendar months from its own start: the book's bundles are per month
 * (`BM-41`), so a yearly period's use is measured month by month against the monthly allowance.
 * The last window ends at the period's end, however short.
 */
export function monthlyWindowsOf(period: UsageWindow): UsageWindow[] {
  const from = period.from.getTime();
  const to = period.to.getTime();
  const windows: UsageWindow[] = [];
  for (let month = 0; monthsAfter(from, month) < to; month += 1) {
    windows.push({
      from: new Date(monthsAfter(from, month)),
      to: new Date(Math.min(monthsAfter(from, month + 1), to)),
    });
  }
  return windows;
}

/**
 * When an unpaid renewal link counts as a failed charge: the moment entitlement ends (`M12-05`),
 * since a link has no failure of its own at the gateway.
 */
export function renewalDueAt(paidPeriodEnd: number): number {
  return paidPeriodEnd + ENTITLEMENT_BUFFER_DAYS * MS_PER_DAY;
}

/**
 * When the gateway stops taking money on the link: the moment the row halts unpaid (`M12-06`).
 * After it, paying is reactivation (`M12-08`), never this link.
 */
export function renewalLinkExpiresAt(paidPeriodEnd: number): number {
  return renewalDueAt(paidPeriodEnd) + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
}
