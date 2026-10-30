import { MS_PER_DAY } from '../format/zone';
import type { MinorUnits } from '../money/minor-units';
import { nextState, PAST_DUE_GRACE_DAYS } from './lifecycle';
import { type BillingState, LIVE_BILLING_STATES } from './states';

/**
 * Charge truth (`M12-09`): what the gateway tells us about a charge, and what it does to a
 * subscription. The facts are provider-neutral — a gateway adapter turns its own events into these,
 * and nothing here names a gateway (`M12-03`).
 *
 * Every moment is the GATEWAY's, in epoch milliseconds: the order of events is the order they
 * happened at the gateway, never the order their messages arrived, so a late or repeated message
 * can never move a subscription back.
 */

/** A charge the gateway collected. Its reference is unique at the gateway, so it is the key. */
export interface ChargeSucceeded {
  readonly subscriptionId: string;
  readonly chargeRef: string;
  readonly occurredAt: number;
  /** The end of the period this charge pays for. */
  readonly paysThrough: number;
  readonly amount: MinorUnits;
  readonly currencyCode: string;
}

/** A charge the gateway tried and could not collect. */
export interface ChargeFailed {
  readonly subscriptionId: string;
  readonly occurredAt: number;
}

/** What a charge needs to know about the subscription it lands on. */
export interface ChargeStanding {
  readonly state: BillingState;
  readonly stateEnteredAt: number;
  readonly paidPeriodEnd: number | null;
  /** When the latest recorded charge happened; `null` before the first one. */
  readonly lastChargedAt: number | null;
  /** The company already holds a newer live subscription — reactivation made one (`M12-08`). */
  readonly replaced: boolean;
}

/**
 * What a successful charge does. `live`: the window becomes `paidPeriodEnd` and, when `moveTo` is
 * set, the subscription enters that state at the charge's moment. `dead`: the payment is recorded
 * and nothing else moves — the row is left only by reactivation, a new row (`M12-08`).
 */
export type SuccessEffect =
  | {
      readonly outcome: 'live';
      readonly paidPeriodEnd: number;
      readonly moveTo: BillingState | null;
    }
  | { readonly outcome: 'dead' };

const LIVE_STATES: ReadonlySet<BillingState> = new Set(LIVE_BILLING_STATES);

/**
 * `M12-09` — the window only grows, and the state moves along the machine's `paid` edge only for
 * a charge at or after the moment the current state was entered: an older charge is older news
 * than the state, so it adds its payment and window and moves nothing. On a tie the charge wins.
 */
export function successEffect(
  standing: ChargeStanding,
  charge: Pick<ChargeSucceeded, 'occurredAt' | 'paysThrough'>,
): SuccessEffect {
  const paidPeriodEnd = Math.max(standing.paidPeriodEnd ?? charge.paysThrough, charge.paysThrough);
  if (LIVE_STATES.has(standing.state)) {
    const to = nextState(standing.state, 'paid');
    const moveTo = to !== null && charge.occurredAt >= standing.stateEnteredAt ? to : null;
    return { outcome: 'live', paidPeriodEnd, moveTo };
  }
  if (
    standing.state === 'halted' &&
    !standing.replaced &&
    paidInsideGrace(standing.stateEnteredAt, charge.occurredAt)
  ) {
    return { outcome: 'live', paidPeriodEnd, moveTo: nextState('halted', 'paid') };
  }
  if (
    standing.state === 'expired' &&
    !standing.replaced &&
    charge.occurredAt < standing.stateEnteredAt
  ) {
    return { outcome: 'live', paidPeriodEnd, moveTo: nextState('expired', 'paid') };
  }
  return { outcome: 'dead' };
}

/**
 * `M12-09` — a failure moves `active` to `past_due` only when it happened after both the moment
 * `active` was entered and the latest recorded charge. Anything else is stale, and a failure on a
 * row in any other state has no edge to take.
 */
export function failureMoves(
  standing: ChargeStanding,
  failure: Pick<ChargeFailed, 'occurredAt'>,
): BillingState | null {
  const newest = Math.max(
    standing.stateEnteredAt,
    standing.lastChargedAt ?? standing.stateEnteredAt,
  );
  return failure.occurredAt > newest ? nextState(standing.state, 'charge_failed') : null;
}

/**
 * An expired trial is taken back to `active` only by a charge made while it was still a trial: the
 * hosted page was paid on day 14 and its message landed after the expiry timer ran (`M12-05`,
 * `M12-54`). The timer records the expiry at the trial's end, so "before" is before that moment.
 * A company that has since reactivated holds the one live row, so the old row stays expired.
 *
 * The timer halts a row at its failure + the grace (`M12-06`). A charge that happened inside that
 * grace — its message landing after the halt — proves the company was never that long unpaid, and
 * our plumbing never blocks a company (`M12-05`). A company that has since reactivated holds a
 * newer live row, and one company holds one live row, so the old row stays halted.
 */
function paidInsideGrace(haltedAt: number, occurredAt: number): boolean {
  return occurredAt < haltedAt && occurredAt >= haltedAt - PAST_DUE_GRACE_DAYS * MS_PER_DAY;
}
