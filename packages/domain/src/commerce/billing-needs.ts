import type { BillingState } from './states';

/**
 * What the billing home's first region holds (`SCR-M12-02` decisions 1, 2; §M12.10): one thing
 * that needs the Owner, and its ONE act — or nothing, when nothing does. The screens render this;
 * they never decide it (Law 11).
 */

/** The facts it is decided from — the home read's own fields, by name. */
export interface BillingNeedsFacts {
  readonly standing: {
    readonly state: BillingState;
    readonly paidPeriodEnd: string | null;
  };
  readonly due: object | null;
  readonly renewal: object | null;
  readonly refund: object | null;
  readonly reactivation: object | null;
  readonly scheduledChange: object | null;
}

/**
 * - `pay`: a charge failed and the grace runs (`M12-06`) — *Pay*.
 * - `renewal`: a yearly renewal's invoice is open (`T-M12-012c`) — *Pay* on its link.
 * - `scheduled_change`: a downgrade or a cycle switch waits for the paid period's end (`M12-49`,
 *   `M12-12`) — *Keep <plan> instead*.
 * - `refund`: the first paid cycle's window is open (`M12-47`) — *Ask for a refund*.
 * - `way_back`: halted, or cancelled past its period — *Reactivate* for one payment (`M12-08`).
 * - `pick_plan`: a trial that ended — *Pick a plan*; no mandate ever existed, so no amount.
 * - `running`: cancelled, still inside its paid period — *Reactivate*, which carries it on.
 */
export type BillingNeed =
  | 'none'
  | 'pay'
  | 'renewal'
  | 'scheduled_change'
  | 'refund'
  | 'way_back'
  | 'pick_plan'
  | 'running';

/**
 * The one need in force at `now`. A state that owes a payment or is dead outranks a live row's
 * window: the way back, then the failed charge, then the open renewal, then a scheduled change,
 * then the refund.
 */
export function billingNeedOf(facts: BillingNeedsFacts, now: number): BillingNeed {
  const { state, paidPeriodEnd } = facts.standing;
  switch (state) {
    case 'trialing':
      return 'none';
    case 'expired':
      return 'pick_plan';
    case 'halted':
      return facts.reactivation === null ? 'none' : 'way_back';
    case 'past_due':
      return facts.due === null ? 'none' : 'pay';
    case 'cancelled': {
      const running = paidPeriodEnd !== null && Date.parse(paidPeriodEnd) > now;
      if (running) return 'running';
      return facts.reactivation === null ? 'none' : 'way_back';
    }
    case 'active':
      return activeNeedOf(facts);
  }
}

/** A live paid row's need: the open renewal, then a scheduled change, then the refund window. */
function activeNeedOf(facts: BillingNeedsFacts): BillingNeed {
  if (facts.renewal !== null) return 'renewal';
  if (facts.scheduledChange !== null) return 'scheduled_change';
  return facts.refund === null ? 'none' : 'refund';
}
