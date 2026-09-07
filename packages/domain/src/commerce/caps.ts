import type { TierLimit } from './tiers';

/**
 * The cap-enforcement law (`BM-34`) and the transparency that must precede it (`BM-27`).
 *
 * A cap never surprises anyone: the usage screen warns at 80%, a banner and a grace window
 * follow at 100%, and only after the grace do new creations of that type pause. Reading, editing
 * what already exists and exporting never pause at any point — those are the soft-block law's
 * (`BM-32`), not this file's.
 *
 * The numbers are here and the SCREEN is `M12`'s. `BM-27` makes the disclosure law rather than
 * polish: the screen shows exactly the rollups the product enforces and bills from, same numbers,
 * no smoothing. Nothing here may be rounded for display on its way to a tenant.
 */

/**
 * `BM-27`, `BM-34` — the first notice is never the block. A bundle discloses its consumption at
 * this percentage, before any gate has fired.
 */
export const CAP_WARNING_PERCENT = 80;

/**
 * `BM-34` — days between a cap reaching 100% and new creations of that type pausing. A separate
 * fact from the `past_due` grace that happens to be the same length: one counts from a full cap,
 * the other from a failed charge, and either could move without the other.
 */
export const CAP_GRACE_DAYS = 7;

/**
 * `BM-34` — whether usage has reached the point where the tenant must already have been told.
 *
 * Integer arithmetic, no division: a count compared against a percentage of a count is exact, and
 * a float here would put the warning a hair early or late on large bundles for no reason.
 *
 * A limit with no number never warns, and the two cases are different rather than merely absent:
 * `unlimited` has no ceiling to approach, and `custom` is negotiated, so nothing in this package
 * knows what its number is. Both answer `false` — a warning about a bound nobody stated would be
 * the dishonesty `BM-27` exists to prevent.
 *
 * A bundle of ZERO is a real book row and not an edge (`BM-41`: Starter voice minutes are
 * pay-as-you-go, which is a bundle of 0 and an overage rate). It warns on the first unit, because
 * there is no headroom to spend — but not before one is used, which the bare arithmetic would
 * otherwise claim by treating 80% of nothing as already reached.
 */
export function capWarningReached(used: number, limit: TierLimit): boolean {
  if (limit === 'unlimited' || limit === 'custom') return false;
  if (limit === 0) return used > 0;
  return used * 100 >= limit * CAP_WARNING_PERCENT;
}
