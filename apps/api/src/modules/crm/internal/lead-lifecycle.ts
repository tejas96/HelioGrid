import type {
  CalendarDate,
  DisqualifyReason,
  LeadClose,
  LeadLifecycle,
  LeadLifecycleState,
  LeadStage,
  LostReason,
} from '@heliogrid/domain';

/** The lead's machine columns as read back (`crm.timeline.repository.ts`). */
export interface LeadLifecycleRow {
  readonly stage: LeadStage;
  readonly state: LeadLifecycleState | null;
  readonly ownerId: string | null;
  readonly wakeOn: CalendarDate | null;
  readonly resurfaceOn: CalendarDate | null;
  readonly noCallUntil: CalendarDate | null;
  readonly closedAs: LeadLifecycleState | null;
  readonly disqualifyReason: DisqualifyReason | null;
  readonly lostReason: LostReason | null;
  readonly closedAt: Date | null;
  readonly closedBy: string | null;
  readonly reopenCount: number;
}

/**
 * The stored close as domain's `LeadClose`. The table's `lead_close_is_whole` check holds the
 * columns together, so a half close is a broken database rather than a case to answer.
 */
function closeOf(row: LeadLifecycleRow): LeadClose | null {
  if (row.closedAs === null || row.closedAt === null || row.closedBy === null) return null;
  const closedBy = { at: row.closedAt.getTime(), by: row.closedBy };
  if (row.closedAs === 'disqualified' && row.disqualifyReason !== null) {
    return { ...closedBy, state: 'disqualified', reason: row.disqualifyReason };
  }
  if (row.closedAs === 'lost' && row.lostReason !== null) {
    return { ...closedBy, state: 'lost', reason: row.lostReason };
  }
  if (row.closedAs === 'junk') return { ...closedBy, state: 'junk' };
  throw new Error(`lead close ${row.closedAs} is stored without its reason`);
}

export function lifecycleOf(row: LeadLifecycleRow): LeadLifecycle {
  return {
    stage: row.stage,
    state: row.state,
    ownerId: row.ownerId,
    wakeOn: row.wakeOn,
    resurfaceOn: row.resurfaceOn,
    noCallUntil: row.noCallUntil,
    close: closeOf(row),
    reopenCount: row.reopenCount,
  };
}

/** The lead's columns after a move, written whole so no machine column is left behind. */
export function lifecycleColumnsOf(next: LeadLifecycle) {
  const close = next.close;
  return {
    stage: next.stage,
    lifecycleState: next.state,
    ownerUserId: next.ownerId,
    snoozeWakeOn: next.wakeOn,
    resurfaceOn: next.resurfaceOn,
    noCallUntil: next.noCallUntil,
    closedAs: close?.state ?? null,
    disqualifyReason: close?.state === 'disqualified' ? close.reason : null,
    lostReason: close?.state === 'lost' ? close.reason : null,
    closedAt: close === null ? null : new Date(close.at),
    closedBy: close?.by ?? null,
    reopenCount: next.reopenCount,
  };
}
