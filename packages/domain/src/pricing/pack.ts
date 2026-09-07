import type { Meter } from '../commerce/meters';
import type { Tier, TierCapacity, TierLimit } from '../commerce/tiers';
import type { MinorUnits } from '../money/minor-units';
import type { BillingCycle } from '../rails/pack';

/**
 * `pack.price-book` — what a market charges (`F1-25`). Per-tier price points for every offered
 * cycle, the bundle sizes and ceilings behind them, the published overage rates, the trial's
 * caps, and the market benchmarks the book was set against.
 *
 * **A book is authored, never derived.** No price in any market is produced by converting another
 * market's book at an exchange rate — not as a default, not as a draft, not as a fallback
 * (`F1-26`). There is deliberately no conversion function in this package and no rate field on
 * this type: a market without an authored book has no prices and cannot sell (`BM-37`).
 *
 * **This file is the FRAMEWORK half and carries no currency and no number** (`BM-37`); the
 * instance lives in `india.ts`. Launching a market is adding a sibling instance — new rows
 * against these same four tiers, with no product change (`BM-38`, `F1-27`).
 *
 * Amounts are `MinorUnits` and the currency is NOT restated here: one currency per tenant,
 * resolved from the same pack's `formats.currency` (`F1-07`). Two homes for it would let a book
 * and its own market disagree. Prices are ex-tax in every market; the scheme and the
 * supplier-of-record posture are `pack.tax`'s (`BM-40`, `F1-13`).
 */

/** A rung bought inside the product: a published price per cycle, ex-tax (`BM-13`, `BM-40`). */
export interface ListedPrice {
  readonly kind: 'listed';
  /** Both cycles are written out, so a tier offered on only one is a compile error, not a gap. */
  readonly perCycle: Record<BillingCycle, MinorUnits>;
}

/**
 * A rung that is SOLD rather than bought (`BM-15`): custom-priced, sales-assisted. The book
 * records the anchor a conversation opens at, never a price anyone can transact on — which is
 * why this is a separate member and not a `perCycle` row with a footnote.
 */
export interface AnchoredPrice {
  readonly kind: 'anchored';
  readonly from: MinorUnits;
  /** The cycle the anchor is QUOTED in. */
  readonly per: BillingCycle;
  /** The cycle actually contracted for, which need not be the one it is quoted in. */
  readonly contract: BillingCycle;
}

export type TierPrice = ListedPrice | AnchoredPrice;

/** One tier as this market sells it: what it costs, and what it buys (`F1-25`, `BM-12`). */
export interface TierBookRow {
  readonly price: TierPrice;
  readonly capacity: TierCapacity;
}

/**
 * The worst-case cost of serving ONE unit of a meter in this market — the figure `BM-17`'s ≥40%
 * overage floor is measured against, and the reason a rate can be judged rather than trusted.
 *
 * There is deliberately no `verified` field. `BM-26` carries the caution verbatim: no COGS figure
 * in this suite is verified, and the floor is computed against the WORST case precisely because
 * the estimates are not. A flag that cannot be written cannot be rendered as a claim.
 *
 * `source` says where the figure came from, so a book whose costs have moved goes stale honestly
 * — the same reason a `Benchmark` records the page it was read from (`BM-39`).
 */
export interface WorstCaseCogs {
  readonly amount: MinorUnits;
  readonly source: string;
}

/**
 * The published rate one unit overruns into (`BM-17`), the worst-case cost that rate must clear,
 * and whether the rate may be sold yet.
 *
 * The cost sits ON the rate rather than in a table beside it, so a rate cannot be authored
 * without the figure that makes it judgeable. `metersBelowCogsFloor` is what judges it.
 *
 * `draft` is behaviour, not a note. A rate the owner has set but not verified against worst-case
 * unit COGS is carried in the book and is NOT sellable until the rate card verifies
 * (`BM-26`, owner ruling `Q1`). A draft number is never silently treated as launch-final.
 */
export interface UnitRate {
  readonly kind: 'per_unit';
  readonly rate: MinorUnits;
  readonly worstCaseCogs: WorstCaseCogs;
  readonly draft: boolean;
}

/**
 * One channel's rate, and the unit it actually bills. An OPEN SET validated against the pack
 * (`F1-09`): the channels a market carries are that market's, so they are VALUES here and no
 * closed channel enumeration is baked into the product. `BM-21` asks for the unit by name,
 * because an upstream that prices by conversation is not billing the same thing as one that
 * prices by message.
 */
export interface ChannelRate {
  readonly channel: string;
  readonly billableUnit: string;
  readonly rate: MinorUnits;
  /** Per channel, never per meter: a WhatsApp conversation and an SMS do not cost the same. */
  readonly worstCaseCogs: WorstCaseCogs;
}

/** A meter billed per channel rather than at one rate (`BM-21`). */
export interface ChannelRates {
  readonly kind: 'per_channel';
  readonly channels: readonly ChannelRate[];
  readonly draft: boolean;
}

/**
 * A meter with no overage at all (`BM-20`). Storage is a ceiling a tenant stops at, not a bundle
 * that runs out into a bill — declared rather than left absent, so "this meter never overruns"
 * and "nobody authored a rate" can never be read as the same thing.
 *
 * It carries no worst-case cost either, and that is not an omission: `BM-17`'s floor is a
 * property of a RATE, and a meter with nothing to overrun into has no rate to hold above a floor.
 */
export interface NoOverage {
  readonly kind: 'ceiling';
}

export type MeterOverage = UnitRate | ChannelRates | NoOverage;

/**
 * What a trial may burn before it is capped (`BM-28`). Only the COGS-bearing meters appear: the
 * trial is full-feature by law, so no kW ceiling and no creation count belongs here.
 *
 * The bundle shape is taken FROM a tier's, so trial and tier allowances can only ever be read
 * the same way, and a sixth meter must be given a trial answer before this compiles.
 */
export interface TrialCaps {
  readonly meterBundles: TierCapacity['meterBundles'];
  readonly storageGb: TierLimit;
}

/**
 * One rung of a competitor's published pricing, at the capacity it serves. The capacity is what
 * makes the comparison honest: `BM-39` prices under the incumbents **at equivalent capacity**,
 * so a rung without one cannot be compared against.
 */
export interface BenchmarkRung {
  /** The competitor's own plan name. A value, never copy. */
  readonly label: string;
  readonly price: MinorUnits;
  readonly cycle: BillingCycle;
  readonly designCeilingKw: number;
  /** `null` where the competitor publishes no such count — declared, never guessed. */
  readonly proposalsPerCycle: number | null;
}

/**
 * A market benchmark, with its provenance (`BM-39`). Which competitor, which page, which day —
 * a benchmark that cannot say where it came from is not a benchmark, and a stale one is
 * re-validated rather than trusted. The date is DATA, the day a figure was read, and it is what
 * lets the book go stale honestly.
 *
 * `rungs` may be empty: a competitor who publishes no prices is still recorded as one the book
 * was set against, which is exactly what an empty list says.
 */
export interface Benchmark {
  readonly competitor: string;
  readonly source: string;
  /** ISO `YYYY-MM-DD`, the day the source was read. */
  readonly readOn: string;
  readonly rungs: readonly BenchmarkRung[];
}

export interface PriceBookPack {
  /**
   * `F1-25` — the per-tier rows. Every tier is written out, and `null` says this market does not
   * sell that rung (`BM-11`): a book-authoring decision, never a product change. Absence would
   * read as an oversight; `null` reads as a decision.
   */
  readonly tiers: Record<Tier, TierBookRow | null>;
  /** `F1-25`, `BM-17` — the rate each meter overruns into. Every meter answers, storage included. */
  readonly overage: Record<Meter, MeterOverage>;
  /** `BM-28` — the trial's caps, market-book data like every other number here. */
  readonly trialCaps: TrialCaps;
  /** `BM-39` — what this book was priced against, with provenance. Never empty in a sold market. */
  readonly benchmarks: readonly Benchmark[];
}
