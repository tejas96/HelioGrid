import type { Meter } from '../commerce/meters';
import type { Tier } from '../commerce/tiers';
import { amountForQuantity, type MinorUnits } from '../money/minor-units';
import type { BillingCycle } from '../rails/pack';
import type { PriceBookPack, TierBookRow } from './pack';

/**
 * The reads of a market's price book. Every number a surface renders comes through one of these,
 * so no screen, invoice or entitlement check reaches into the book's shape for itself
 * (`BM-09`, `F1-60`).
 */

/** The book's row for this tier, or `null` where the market does not sell that rung (`BM-11`). */
export function tierRow(book: PriceBookPack, tier: Tier): TierBookRow | null {
  return book.tiers[tier];
}

/**
 * What this tier costs on this cycle, or `null` where there is no price to render — the market
 * does not sell the rung, or the rung is sales-assisted and has an anchor rather than a price
 * (`BM-15`). A caller that wants the anchor asks for the row and reads it, deliberately: an
 * anchor rendered as a price would be a number no one can actually transact on.
 */
export function listedPrice(
  book: PriceBookPack,
  tier: Tier,
  cycle: BillingCycle,
): MinorUnits | null {
  const row = tierRow(book, tier);
  if (row === null || row.price.kind !== 'listed') return null;
  return row.price.perCycle[cycle];
}

/**
 * `BM-26` — whether this meter's rate may be sold today. A rate the owner has set but not yet
 * verified against worst-case unit COGS is DRAFT, and a draft meter is not sellable however
 * complete the book looks (owner ruling `Q1`; verification is its revisit trigger).
 *
 * A ceiling meter is sellable: it has no rate to be draft, because a tenant at the ceiling stops
 * rather than overruns (`BM-20`).
 */
export function isSellable(book: PriceBookPack, meter: Meter): boolean {
  const overage = book.overage[meter];
  return overage.kind === 'ceiling' || !overage.draft;
}

/**
 * `BM-13` — what a year costs at the pay-for-ten-get-twelve principle. This is the SIZING rule a
 * book is authored against, never the price: where an authored yearly row differs, the row wins
 * and this says by how much. The IN book's Pro year is ₹9 above it and is carried as-is
 * (`BM-41`).
 */
export function tenMonthYearly(monthly: MinorUnits): MinorUnits {
  return amountForQuantity(monthly, MONTHS_BILLED_IN_A_YEAR);
}

/** `BM-13` — pay for ten months, get twelve. Two months free, one collection a year. */
const MONTHS_BILLED_IN_A_YEAR = 10;
