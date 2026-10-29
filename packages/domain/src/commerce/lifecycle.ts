import { MS_PER_DAY } from '../format/zone';
import type { BillingPhase } from './soft-block';
import type { BillingState } from './states';
import { TRIAL_DAYS } from './trial';

/**
 * The subscription lifecycle — one machine, six states (`M12-04`). This file owns the edges, the
 * timers and the phase the clock puts a subscription in; `states.ts` owns the names and
 * `soft-block.ts` what each phase may do.
 *
 * Every moment here is epoch milliseconds handed in by the caller: this package holds no clock.
 * A billing timer is a platform sweep, which `F1-10` lets run on a fixed clock, so a day is a
 * whole 24 hours from the moment a state was entered — never a tenant-local midnight.
 */

/** Why a subscription entered a state — the history's one vocabulary (`M12-04`, §M12.2). */
export const SUBSCRIPTION_CAUSES = [
  'trial_started',
  'paid',
  'charge_failed',
  'cancelled',
  'trial_expired',
  'grace_expired',
] as const;

export type SubscriptionCause = (typeof SUBSCRIPTION_CAUSES)[number];

/** `M12-06` — `past_due` lasts this many days unpaid, then the subscription is `halted`. */
export const PAST_DUE_GRACE_DAYS = 7;

/** `M12-06` — from this day of `past_due` the per-use features pause; core selling goes on. */
export const METERED_PAUSE_DAY = 4;

/** `M12-05` — entitlement runs this many days past a paid period's end, for webhook lag. */
export const ENTITLEMENT_BUFFER_DAYS = 3;

/**
 * `M12-04` — every edge of the machine. `expired` and `cancelled` have none: each is left only by
 * reactivation, which starts a NEW subscription (`M12-08`). `halted` has one, `paid`, and
 * `charges.ts` admits it only for a charge that happened inside the grace the timer halted it at
 * the end of; every other halt, too, is left only by reactivation. No state and no cause is a
 * pause (`M12-13`).
 *
 * Exhaustive over the states, so a seventh state fails to compile until its edges are written.
 */
const EDGES: Readonly<
  Record<BillingState, Readonly<Partial<Record<SubscriptionCause, BillingState>>>>
> = {
  trialing: { paid: 'active', trial_expired: 'expired' },
  active: { charge_failed: 'past_due', cancelled: 'cancelled' },
  past_due: { paid: 'active', grace_expired: 'halted' },
  halted: { paid: 'active' },
  expired: {},
  cancelled: {},
};

/** The state this cause moves a subscription to, or `null` when the machine has no such edge. */
export function nextState(state: BillingState, cause: SubscriptionCause): BillingState | null {
  return EDGES[state][cause] ?? null;
}

/** What the clock knows about one subscription. */
export interface SubscriptionClock {
  readonly state: BillingState;
  readonly stateEnteredAt: number;
  /** Set on a subscription that began as a trial; `null` on one that never trialled. */
  readonly trialEndsAt: number | null;
  /** Set from conversion onward; `null` while no period has been paid. */
  readonly paidPeriodEnd: number | null;
}

/** `M12-52` — when a trial started at this moment ends. */
export function trialEndsAtFor(startedAt: number): number {
  return startedAt + TRIAL_DAYS * MS_PER_DAY;
}

/** `M12-05` — the last moment a paid period entitles a company, the webhook buffer included. */
export function entitledUntil(paidPeriodEnd: number): number {
  return paidPeriodEnd + ENTITLEMENT_BUFFER_DAYS * MS_PER_DAY;
}

/** A timed transition the clock owes: its cause, and the moment it fell due. */
export interface DueTimedCause {
  readonly cause: 'trial_expired' | 'grace_expired';
  readonly dueAt: number;
}

/**
 * The timed transition a subscription is owed at `now`, or `null`. The sweep records `dueAt` as
 * the moment the new state was entered, so a late or retried sweep writes the same history.
 */
export function dueTimedCause(subscription: SubscriptionClock, now: number): DueTimedCause | null {
  if (subscription.state === 'trialing' && subscription.trialEndsAt !== null) {
    const dueAt = subscription.trialEndsAt;
    return now >= dueAt ? { cause: 'trial_expired', dueAt } : null;
  }
  if (subscription.state === 'past_due') {
    const dueAt = subscription.stateEnteredAt + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
    return now >= dueAt ? { cause: 'grace_expired', dueAt } : null;
  }
  return null;
}

/**
 * The phase a subscription is in at `now` (`M12-05`–`M12-07`). It settles any timed transition
 * the sweep has not recorded yet, so a late sweep never shows a company the wrong phase.
 *
 * `active` never turns to a block on the clock: only a failed charge leaves it (`M12-05`).
 */
export function billingPhaseAt(subscription: SubscriptionClock, now: number): BillingPhase {
  const due = dueTimedCause(subscription, now);
  const state =
    due === null
      ? subscription.state
      : (nextState(subscription.state, due.cause) ?? subscription.state);
  switch (state) {
    case 'past_due':
      return wholeDaysSince(subscription.stateEnteredAt, now) >= METERED_PAUSE_DAY
        ? 'past_due_metered_paused'
        : 'past_due_full_function';
    case 'cancelled':
      // `M12-50` — a cancelled company keeps its service until the paid period ends.
      return subscription.paidPeriodEnd !== null && now < subscription.paidPeriodEnd
        ? 'active'
        : 'cancelled_post_period';
    default:
      return state;
  }
}

function wholeDaysSince(moment: number, now: number): number {
  return Math.floor((now - moment) / MS_PER_DAY);
}
