import type { BillingHomeRepository, HomeRow } from '../billing-home.repository';
import { monthlyWindowsOf } from './renewal-moments';

/** The cycle every usage count covers: its start, and the moment the counts reset. */
export interface UsageCycle {
  readonly from: Date;
  readonly resetsAt: Date;
}

/**
 * This cycle (`M12-30`: counts reset on the company's own billing anchor): the trial's days on a
 * row that never paid; else the current paid period, cut to its calendar month on a yearly cycle,
 * since the book's bundles are per month (`BM-41`). The billing home, the usage screen and its
 * events all read this one window, so no two figures cover different days.
 */
export async function usageCycleOf(
  rows: BillingHomeRepository,
  tenantId: string,
  row: HomeRow,
  now: number,
): Promise<UsageCycle> {
  const start = await rows.paidPeriodStart(tenantId, row.id);
  if (start === null || row.paidPeriodEnd === null) {
    return { from: new Date(row.createdAt), resetsAt: new Date(row.trialEndsAt ?? now) };
  }
  const period = { from: new Date(start), to: new Date(row.paidPeriodEnd) };
  if (row.cycle !== 'yearly') return { from: period.from, resetsAt: period.to };
  const months = monthlyWindowsOf(period);
  const current = months.findLast((month) => month.from.getTime() <= now);
  return { from: current?.from ?? period.from, resetsAt: current?.to ?? period.to };
}
