import { isOverdue, type TaskDue } from '../tasks/overdue';
import type { LeadLifecycleState, LeadStage } from './vocabulary';

/**
 * The load the assign picker shows beside each face (`M02-28`), and the open count each assignment
 * records (`M02-30`): what "open" and "overdue" mean, once, for the picker, the trail and the counts
 * the api reads in SQL.
 */

/** What an open count reads off a lead. */
export interface LoadLead {
  readonly ownerId: string | null;
  readonly stage: LeadStage;
  readonly state: LeadLifecycleState | null;
}

/** What an overdue count reads off a task. */
export interface LoadTask extends TaskDue {
  readonly assigneeId: string;
}

/**
 * An open lead is owned and being worked: no R9 state — not parked, not closed — and not `won`, the
 * one stage that has left the funnel for a project (`M02-57`).
 */
export function isOpenLead(lead: LoadLead): boolean {
  return lead.ownerId !== null && lead.state === null && lead.stage !== 'won';
}

export interface MemberLoad {
  readonly open: number;
  readonly overdue: number;
}

/**
 * Each member's open leads and overdue tasks, in the order the members were given; a member with
 * none counts zero, and a row owned by someone not listed counts for no one.
 */
export function memberLoads(
  memberIds: readonly string[],
  leads: readonly LoadLead[],
  tasks: readonly LoadTask[],
  nowEpoch: number,
): ReadonlyMap<string, MemberLoad> {
  return new Map(
    memberIds.map((memberId) => [
      memberId,
      {
        open: leads.filter((lead) => lead.ownerId === memberId && isOpenLead(lead)).length,
        overdue: tasks.filter((task) => task.assigneeId === memberId && isOverdue(task, nowEpoch))
          .length,
      },
    ]),
  );
}

/**
 * Who waiting leads are offered to in one tap (plan gap 17): the holder with the fewest open
 * leads; on a tie the first in the order given (by name), so the offer never flickers between
 * equals. `null` when no one can hold a lead.
 */
export function lightestHolderOf<T extends { readonly userId: string }>(
  holders: readonly T[],
  openLeads: ReadonlyMap<string, number>,
): (T & { readonly openLeads: number }) | null {
  let best: (T & { readonly openLeads: number }) | null = null;
  for (const holder of holders) {
    const open = openLeads.get(holder.userId) ?? 0;
    if (best === null || open < best.openLeads) best = { ...holder, openLeads: open };
  }
  return best;
}
