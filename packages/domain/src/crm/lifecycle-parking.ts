import type { CalendarDate } from '../format/holidays';
import {
  isClosed,
  isFutureDay,
  type LeadActResult,
  type LeadLifecycle,
  moved,
  refused,
  stateMove,
} from './lifecycle-model';

/**
 * The parking states (`M02-51`, `M02-52`): snoozed and dormant hold a lead out of the day's work and
 * never move its stage, and every timer here fires at 09:00 tenant-local (`M02-49`, `crm-clock.ts`).
 */

/**
 * Snooze with its mandatory wake date, a day after today (`M02-51`). Snoozing a snoozed lead moves
 * its date; a dormant lead parks as snoozed; a closed lead takes no snooze until a reopen.
 */
export function snooze(
  lead: LeadLifecycle,
  wakeOn: CalendarDate | null,
  today: CalendarDate,
): LeadActResult {
  if (isClosed(lead)) return refused('lead_closed');
  if (wakeOn === null || !isFutureDay(wakeOn, today)) return refused('wake_date_not_future');
  return moved({ ...lead, state: 'snoozed', wakeOn }, stateMove(lead, 'snoozed', 'manual'));
}

/**
 * The 09:00 sweep wakes a snoozed lead on its date or after (a missed sweep catches up): it returns
 * to its stage with a follow-up task (`M02-51`).
 */
export function wake(lead: LeadLifecycle, today: CalendarDate): LeadActResult {
  if (lead.state !== 'snoozed') return refused('not_snoozed');
  if (lead.wakeOn !== null && lead.wakeOn > today) return refused('not_due');
  return moved(
    { ...lead, state: null, wakeOn: null },
    stateMove(lead, null, 'wake'),
    'snooze_wake',
  );
}

/** *Wake up now*: a person takes the lead back before its date, so no task is raised for them. */
export function wakeNow(lead: LeadLifecycle): LeadActResult {
  if (lead.state !== 'snoozed') return refused('not_snoozed');
  return moved({ ...lead, state: null, wakeOn: null }, stateMove(lead, null, 'manual'));
}

/**
 * The sweep flags an active lead dormant after thirty quiet days on an open stage (`M02-52`,
 * `isDormantDue`). Never a person's act, never a lead already parked or closed, never a won one —
 * `won` is the one stage no longer open.
 */
export function flagDormant(lead: LeadLifecycle): LeadActResult {
  if (lead.state !== null || lead.stage === 'won') return refused('not_open');
  return moved({ ...lead, state: 'dormant' }, stateMove(lead, 'dormant', 'automation'));
}
