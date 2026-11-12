/**
 * The owner dashboard's rules (`M13`): read-only figures, honest at small numbers. The median is the
 * database's (`percentile_disc`), so no money figure is worked out here.
 */

export { COMPANY_REPORTS, readsCompanyWide } from './company-wide';
export type { NeedsYouCounts, NeedsYouKind } from './needs-you';
export { NEEDS_YOU_KINDS, needsYouKindsOf } from './needs-you';
export { SUMMARY_TIME, summaryMonthDue, winRateWindowStart } from './periods';
export type { WinRate } from './win-rate';
export { WIN_RATE_MIN_CLOSED, WIN_RATE_WINDOW_DAYS, winRateOf } from './win-rate';
