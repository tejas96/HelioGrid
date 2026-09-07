/**
 * The commercial structure vocabularies — how this product is packaged and sold, market-neutral
 * and currency-free (`BM-11`, `BM-12`, `BM-16`, `BM-33`). Four closed lists and one map.
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
export type { Meter } from './meters';
export { METERS } from './meters';
export type { BillingState } from './states';
export { BILLING_STATES } from './states';
export type { CountedCreation, Tier, TierCapacity, TierLimit } from './tiers';
export { COUNTED_CREATIONS, TIERS, tierBand } from './tiers';
