import { MS_PER_DAY } from '../format/zone';
import type { BillingCycle, CollectionKind, PaymentRailsPack } from '../rails/pack';
import {
  billingPhaseAt,
  dueTimedCause,
  METERED_PAUSE_DAY,
  nextState,
  pastDueHaltsAt,
  type SubscriptionClock,
} from './lifecycle';
import type { BillingPhase } from './soft-block';
import type { BillingState } from './states';
import { type Tier, tierBand } from './tiers';

/**
 * Where a company's subscription stands at `now`, with no amount (`M12-56`): what everyone in the
 * company may read, the shell's strip and the billing home both. A timed move the sweep has not
 * recorded yet is settled here, as `billingPhaseAt` settles it, so a late sweep never shows the
 * wrong state; each date is set only in the state that has it.
 */

/** One subscription row as the standing reads it: the clock and the plan it pays for. */
export interface StandingRow extends SubscriptionClock {
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
}

export interface BillingStandingFacts {
  readonly state: BillingState;
  readonly phase: BillingPhase;
  readonly tier: Tier | null;
  readonly cycle: BillingCycle | null;
  /** How the market's ladder collects this tier on this cycle; `null` before a plan is paid. */
  readonly collection: CollectionKind | null;
  readonly stateEnteredAt: number;
  /** A trial's end, while it runs or once it ended unpaid. */
  readonly trialEndsAt: number | null;
  /** `past_due`: the moment the per-use features pause (`M12-06`). */
  readonly pausesAt: number | null;
  /** `past_due`: the moment the row halts unpaid. */
  readonly graceEndsAt: number | null;
  readonly paidPeriodEnd: number | null;
}

export function billingStandingOf(
  row: StandingRow,
  ladder: PaymentRailsPack['ladder'],
  now: number,
): BillingStandingFacts {
  const due = dueTimedCause(row, now);
  const state = due === null ? row.state : (nextState(row.state, due.cause) ?? row.state);
  const stateEnteredAt = due === null ? row.stateEnteredAt : due.dueAt;
  const pastDue = state === 'past_due';
  const trialShown = state === 'trialing' || state === 'expired';
  return {
    state,
    phase: billingPhaseAt(row, now),
    tier: row.tier,
    cycle: row.cycle,
    collection:
      row.tier === null || row.cycle === null
        ? null
        : ladder[tierBand(row.tier)][row.cycle].collection,
    stateEnteredAt,
    trialEndsAt: trialShown ? row.trialEndsAt : null,
    pausesAt: pastDue ? stateEnteredAt + METERED_PAUSE_DAY * MS_PER_DAY : null,
    graceEndsAt: pastDue ? pastDueHaltsAt(stateEnteredAt) : null,
    paidPeriodEnd: row.paidPeriodEnd,
  };
}
