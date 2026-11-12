import type { CalendarDate } from '../format/holidays';
import { chainIndexOf } from '../projects/machine';
import type { ProjectChainStage, ProjectStage } from '../projects/stages';
import type { TrancheState } from './vocabulary';

/**
 * When a part fell due (`M11-11`, `M11-12`): the moment the project first REACHED its stage
 * (owner ruling 2026-11-10) — a later stage counts, so a skipped stage is passed. A move back
 * below it takes the due-ness away again only while nobody has asked for that money or been paid
 * any of it (ruling 2026-11-10): once a customer was asked, the part stays due. A cancel moves
 * nothing either way — what was owed at the cancel is still owed (`M11-50`).
 */

/** One row of the project's stage history: where it went, and when. */
export interface StageArrival {
  readonly to: ProjectStage;
  readonly at: number;
}

/**
 * The instant the part became due, or `null` while it is not. `arrivals` are oldest first; `held`
 * is whether the part was asked for or paid — what keeps it due after a move back.
 */
export function dueSinceOf(
  dueOnStage: ProjectChainStage,
  arrivals: readonly StageArrival[],
  held: boolean,
): number | null {
  const needed = chainIndexOf(dueOnStage);
  let since: number | null = null;
  for (const arrival of arrivals) {
    if (arrival.to === 'cancelled') continue;
    const reached = chainIndexOf(arrival.to) >= needed;
    if (reached && since === null) since = arrival.at;
    if (!reached && !held) since = null;
  }
  return since;
}

/**
 * Where a waiting part sits on Money due (`M11-54`): part paid, wherever it stands; else due on the
 * day it fell due and late from the day after — no grace and no threshold.
 */
export const MONEY_DUE_GROUPS = ['late', 'due', 'part'] as const;
export type MoneyDueGroup = (typeof MONEY_DUE_GROUPS)[number];

export function moneyDueGroupOf(
  state: TrancheState,
  dueOn: CalendarDate,
  today: CalendarDate,
): MoneyDueGroup {
  if (state === 'part_received') return 'part';
  return dueOn < today ? 'late' : 'due';
}

/** One group of Money due as it is drawn: its tile, its rows shown, and how many wait behind. */
export interface MoneyDueGroupView<Row> {
  readonly group: MoneyDueGroup;
  readonly count: number;
  readonly amount: string;
  readonly rows: readonly Row[];
  /** Rows behind *Show all*; 0 once the group is open or holds no more. */
  readonly hidden: number;
}
