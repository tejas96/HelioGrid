/**
 * "What needs you" in order (`M13-15`, `M13-20`): what only the owner can unblock first — leads
 * nobody owns, then money paid late, then work blocked on the company itself, then the deals
 * waiting longest, then the reader's own overdue tasks. An item with nothing waiting is left out:
 * the list never shows a zero as if it were urgent (`M13-12`).
 */
export const NEEDS_YOU_KINDS = [
  'unassigned',
  'payments_late',
  'blocked_on_us',
  'waiting_longest',
  'my_overdue_tasks',
] as const;
export type NeedsYouKind = (typeof NEEDS_YOU_KINDS)[number];

/** How many of each wait, as the read counts them. */
export interface NeedsYouCounts {
  readonly unassigned: number;
  readonly paymentsLate: number;
  readonly blockedOnUs: number;
  readonly waitingLongest: number;
  readonly myOverdueTasks: number;
}

const COUNT_OF: Record<NeedsYouKind, (counts: NeedsYouCounts) => number> = {
  unassigned: (counts) => counts.unassigned,
  payments_late: (counts) => counts.paymentsLate,
  blocked_on_us: (counts) => counts.blockedOnUs,
  waiting_longest: (counts) => counts.waitingLongest,
  my_overdue_tasks: (counts) => counts.myOverdueTasks,
};

export function needsYouKindsOf(counts: NeedsYouCounts): readonly NeedsYouKind[] {
  return NEEDS_YOU_KINDS.filter((kind) => COUNT_OF[kind](counts) > 0);
}
