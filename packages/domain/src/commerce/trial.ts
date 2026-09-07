import type { BillingState } from './states';

/**
 * The trial contract (`BM-28`–`BM-30`) — the product's only non-paying motion, and the only one
 * there will ever be (`BM-03`: a time-boxed trial exists, a perpetually free tier does not).
 *
 * What lives here is the trial's SHAPE: how long it runs, and which states a tenant reaches
 * without ever having paid. What it may DO is `trialCapacity()`'s, because the caps are book data
 * (`BM-41`). The transitions, the nudges, the expiry sweep and the support-grantable extension are
 * `M12`'s mechanics, cited by every row here.
 *
 * Two of `BM-30`'s promises are kept by ABSENCE rather than by code, and both are constraints on
 * what may be added later: an `expired` trial is terminal as a trial, so nothing may author a
 * route back to `trialing`; and no trial data is ever deleted for non-conversion, so no retention
 * clock may ever key on this state. `expired`'s capability column — read, export and customer
 * links still working — is the soft-block matrix's (`T-FCORE-014`), not a second answer here.
 */

/**
 * `BM-28` — fourteen days, the whole product, no payment instrument to start it.
 *
 * DAYS, and no instant: this package holds no clock, and `F1-10` puts every time comparison on
 * the TENANT's clock, which a caller holds and this does not. `M12`'s expiry sweep turns this
 * number into a moment; turning it into one here would need a second day-in-milliseconds
 * constant, which `format/datetime.ts` already owns privately.
 */
export const TRIAL_DAYS = 14;

/**
 * Whether a tenant in this state has ever established a payment instrument (`BM-29`): the mandate
 * or method is established at CONVERSION and never at signup, so the two states before one exists
 * are the trial and the trial that ran out.
 *
 * Read the other way this is `BM-03`'s guarantee, and it is the same fact rather than a second
 * one: `false` appears exactly twice, so the only non-paying states are `trialing` and its
 * `expired` aftermath, and no path into a perpetual free tier can be authored without changing
 * this map. `past_due`, `halted` and `cancelled` all read `true` — each is reachable only THROUGH
 * a conversion, so each describes a tenant who paid, not one who never did.
 *
 * An exhaustive `Record`, so a seventh billing state is a compile error here rather than a quiet
 * `undefined` that would read as "never paid" and silently widen the free tier.
 */
const HAS_EVER_PAID: Record<BillingState, boolean> = {
  trialing: false,
  active: true,
  past_due: true,
  halted: true,
  expired: false,
  cancelled: true,
};

/** `BM-03`, `BM-29` — a tenant in this state has no payment instrument and has never paid. */
export function isNonPaying(state: BillingState): boolean {
  return !HAS_EVER_PAID[state];
}
