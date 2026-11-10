import type { CalendarDate } from '../format/holidays';
import { noCallUntilOf } from './crm-clock';
import {
  isClosed,
  isFutureDay,
  type LeadActContext,
  type LeadActResult,
  type LeadLifecycle,
  moved,
  refused,
  stateMove,
} from './lifecycle-model';
import {
  DISQUALIFY_REASONS,
  type DisqualifyReason,
  type LeadLifecycleState,
  LOST_REASONS,
  type LostReason,
} from './vocabulary';

/**
 * The terminal states (`M02-53`…`M02-56`): disqualified, lost and junk close a lead without moving
 * its stage and without deleting it, and a reopen returns it to that stage with the close kept on
 * the record. A lead is closed once at a time: closing a closed lead is refused.
 */

function isListed<Reason extends string>(
  reasons: readonly Reason[],
  reason: string | null,
): reason is Reason {
  return reasons.some((listed) => listed === reason);
}

/** Disqualify with one of the six reasons (`M02-42`, `M02-53`); no timer follows. */
export function disqualify(
  lead: LeadLifecycle,
  reason: string | null,
  context: LeadActContext,
): LeadActResult {
  if (isClosed(lead)) return refused('lead_closed');
  if (!isListed<DisqualifyReason>(DISQUALIFY_REASONS, reason)) return refused('reason_not_listed');
  const close = { state: 'disqualified', reason, at: context.at, by: context.by } as const;
  return moved(
    { ...lead, state: 'disqualified', wakeOn: null, close },
    stateMove(lead, 'disqualified', 'manual'),
  );
}

/** Junk (`M02-55`): it leaves every queue, is found by search alone, and is never deleted. */
export function junk(lead: LeadLifecycle, context: LeadActContext): LeadActResult {
  if (isClosed(lead)) return refused('lead_closed');
  const close = { state: 'junk', at: context.at, by: context.by } as const;
  return moved({ ...lead, state: 'junk', wakeOn: null, close }, stateMove(lead, 'junk', 'manual'));
}

/**
 * Lost with one of the seven reasons (`M02-54`). *Postponed* needs the day it resurfaces, after
 * today; *not interested* holds every call task back for six months from today.
 */
export function markLost(
  lead: LeadLifecycle,
  loss: { readonly reason: string | null; readonly resurfaceOn?: CalendarDate | null },
  context: LeadActContext,
): LeadActResult {
  const { reason } = loss;
  if (isClosed(lead)) return refused('lead_closed');
  if (!isListed<LostReason>(LOST_REASONS, reason)) return refused('reason_not_listed');
  const postponed = reason === 'postponed';
  if (postponed && !isFutureDay(loss.resurfaceOn, context.today)) {
    return refused('resurface_date_not_future');
  }
  const close = { state: 'lost', reason, at: context.at, by: context.by } as const;
  return moved(
    {
      ...lead,
      state: 'lost',
      wakeOn: null,
      resurfaceOn: postponed ? (loss.resurfaceOn ?? null) : null,
      noCallUntil: reason === 'not_interested' ? noCallUntilOf(context.today) : null,
      close,
    },
    stateMove(lead, 'lost', 'manual'),
  );
}

/** The states a person reopens from (`M02-56`); a snoozed lead is woken instead. */
const REOPENABLE: readonly LeadLifecycleState[] = ['lost', 'disqualified', 'dormant', 'junk'];

/**
 * Reopen (`M02-56`): the lead re-enters its stage at once, reopens are counted, and the close —
 * reason, moment, who — stays on the record. The close's own timers end with it: a person reopening
 * a lead is working it again, so no resurface date or no-call spell outlives the close.
 */
export function reopen(lead: LeadLifecycle): LeadActResult {
  if (lead.state === null || !REOPENABLE.includes(lead.state)) return refused('not_reopenable');
  return moved(
    {
      ...lead,
      state: null,
      resurfaceOn: null,
      noCallUntil: null,
      reopenCount: lead.reopenCount + 1,
    },
    stateMove(lead, null, 'reopen'),
  );
}

/**
 * The 09:00 sweep resurfaces a loss postponed to today or earlier (`M02-54`): it returns to its
 * stage with a follow-up task. A timer's return, not a person's reopen, so it is not counted as one;
 * the close stays on the record.
 */
export function resurface(lead: LeadLifecycle, today: CalendarDate): LeadActResult {
  if (lead.state !== 'lost' || lead.resurfaceOn === null) return refused('not_postponed');
  if (lead.resurfaceOn > today) return refused('not_due');
  return moved(
    { ...lead, state: null, resurfaceOn: null },
    stateMove(lead, null, 'wake'),
    'resurface',
  );
}
