import type { CalendarDate } from '../format/holidays';
import { isClosedStage, type ProjectStanding } from './machine';
import type { BlockerParty, BlockerReason, ProjectActRefusal } from './vocabulary';
import { isReasonOfParty } from './vocabulary';

/**
 * Waits and documents — the two acts beside the stage (`M08-20`…`M08-31`, rulings 2026-11-10).
 * A wait rides on its stage and never moves it (`M08-22`); one wait is open at a time, its party
 * and reason class required and its start never a day ahead (`M08-21`).
 */

/** The longest note a wait or a *Not needed* reason keeps. */
export const PROJECT_NOTE_MAX = 500;

/** Whole days from one company day to another — the days figure every list shows (`M08-11`). */
export function daysFrom(from: CalendarDate, to: CalendarDate): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86_400_000)) : 0;
}

export interface WaitToStart {
  readonly party: BlockerParty;
  readonly reason: BlockerReason;
  readonly startedOn: CalendarDate;
}

/** Whether a wait may start: open project, no wait already open, a reason of its party, not ahead. */
export function decideWaitStart(
  standing: ProjectStanding,
  wait: WaitToStart,
  hasOpenWait: boolean,
  today: CalendarDate,
): ProjectActRefusal | null {
  if (isClosedStage(standing.stage)) return 'project_closed';
  if (hasOpenWait) return 'wait_open';
  if (!isReasonOfParty(wait.party, wait.reason)) return 'reason_not_of_party';
  if (wait.startedOn > today) return 'date_in_future';
  return null;
}

/** Whether the open wait may be ended by a person. */
export function decideWaitEnd(hasOpenWait: boolean): ProjectActRefusal | null {
  return hasOpenWait ? null : 'no_open_wait';
}

/** *Not needed* takes its reason, in the person's words (`M08-31` as ruled). */
export function decideNotNeeded(
  standing: ProjectStanding,
  reason: string,
): ProjectActRefusal | null {
  if (isClosedStage(standing.stage)) return 'project_closed';
  return reason.trim().length === 0 ? 'reason_needed' : null;
}

/** A checklist row as handover reads it. */
export interface HandoverRow {
  readonly row: string;
  readonly state: 'pending' | 'done' | 'not_needed';
  /** `handover` when the handover itself makes the row (the pack). */
  readonly madeBy: string | null;
}

/**
 * The rows still waiting on a person (`M08-32`): every row past pending is the condition, save the
 * one handover itself makes — waiting on it would make handover wait on itself.
 */
export function rowsWaitingForHandover(rows: readonly HandoverRow[]): readonly string[] {
  return rows
    .filter((row) => row.state === 'pending' && row.madeBy !== 'handover')
    .map((row) => row.row);
}
