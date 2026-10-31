import { MS_PER_DAY } from '../format/zone';
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

/**
 * `M12-30` — where one capped count stands on the ladder: quiet, warned at 80%, in its 7-day grace
 * from the moment it reached 100%, or paused for new creations until the cycle resets (or an
 * upgrade raises the limit). Reading, editing what exists and exporting are never on this ladder.
 */
export type CapStep =
  | { readonly step: 'clear' }
  | { readonly step: 'warning' }
  | { readonly step: 'grace'; readonly pausesAt: number }
  | { readonly step: 'paused'; readonly resetsAt: number };

export interface CapReading {
  readonly used: number;
  readonly limit: TierLimit;
  /**
   * When the count reached its limit this cycle, read by the caller from its own rows — so the
   * grace has no timer and no stored counter that could drift from the count (`M12-32`). `null`
   * when the caller has just seen it reach the limit: the grace starts now.
   */
  readonly fullSince: number | null;
  readonly cycleEndsAt: number;
  readonly now: number;
}

export function capStepOf({ used, limit, fullSince, cycleEndsAt, now }: CapReading): CapStep {
  if (limit === 'unlimited' || limit === 'custom') return { step: 'clear' };
  const full = limit === 0 ? used > 0 : used >= limit;
  if (!full) return capWarningReached(used, limit) ? { step: 'warning' } : { step: 'clear' };
  const pausesAt = (fullSince ?? now) + CAP_GRACE_DAYS * MS_PER_DAY;
  return now < pausesAt ? { step: 'grace', pausesAt } : { step: 'paused', resetsAt: cycleEndsAt };
}
