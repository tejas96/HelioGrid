/**
 * The commercial structure vocabularies — how this product is packaged and sold, market-neutral
 * and currency-free (`BM-11`, `BM-12`, `BM-16`, `BM-33`). Eight closed lists and one map.
 *
 * Four of them say what a tenant is SOLD; four say what the platform pays for instead
 * (`costs.ts` — `BM-23`, `BM-24`, `BM-25`). The second half exists because an absence reads as an
 * oversight: a cost the product promised to swallow has to be written down to stay swallowed.
 *
 * These are NOT a market-pack key. A pack key is a market FACT that varies per market; these are
 * the structure every market prices against, which is what makes `BM-38` true — launching a
 * market adds price rows and changes no product code. The numbers live in that market's price
 * book (`T-FCORE-010`), and the lifecycle, the ledger and the entitlement gates live in `M12`.
 *
 * `STANDING_METER` is not exported on purpose. It exists to keep storage out of the per-cycle
 * bundle record (`BM-12`, `BM-20`), and the TYPE already carries that everywhere it matters — a
 * consumer reads the shape, never the exception behind it.
 */
export type {
  AbsorbedCost,
  FreeUpstream,
  NeverMeteredCapability,
  ProxiedUpstream,
} from './costs';
export {
  ABSORBED_COSTS,
  FREE_UPSTREAMS,
  NEVER_METERED,
  PROXIED_UPSTREAMS,
} from './costs';
export type { Meter } from './meters';
export { METERS } from './meters';
export type { BillingState } from './states';
export { BILLING_STATES } from './states';
export type { CountedCreation, Tier, TierCapacity, TierLimit } from './tiers';
export { COUNTED_CREATIONS, TIERS, tierBand } from './tiers';
export { isNonPaying, TRIAL_DAYS } from './trial';
