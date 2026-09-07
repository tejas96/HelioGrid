import type { TierBand } from '../rails/pack';
import type { Meter } from './meters';

/**
 * The four tiers, fixed names and suite-wide vocabulary (`BM-11`). Every market's book prices
 * these same four in its own currency (`F1-25`), every entitlement is keyed to them (`M12`) and
 * every plan-segmented report uses them (`M13`). No market renames, adds or removes one: a market
 * that cannot serve a tier's capacity authors no book row for it, which is a book decision and
 * never a product change.
 *
 * Ordered entry-first, because the order IS the capacity ladder (`BM-12`).
 *
 * Lowercase identifiers, like every other vocabulary in this package. What a pricing or billing
 * screen PRINTS is a label, and `§04.2` already rules that a tier label renders as-is in every
 * locale; it lands with the first screen that renders one (Law 9), never as a second list here.
 */
export const TIERS = ['starter', 'growth', 'pro', 'enterprise'] as const;

export type Tier = (typeof TIERS)[number];

/**
 * How each tier is BOUGHT (`BM-14`, `BM-15`): the first three are bought through the product, and
 * Enterprise is sold — sales-assisted, on an annual contract. `pack.payment-rails` keys its
 * mandate ladder on the BAND and never on the tier, so the market decides the rail and this
 * decides which ladder row to read (`F1-18`).
 *
 * `T-FCORE-006` authored `TIER_BANDS` and deliberately left this map out, having no tier
 * vocabulary to write it against. Written as an exhaustive `Record` so a fifth tier is a compile
 * error here rather than a quiet `undefined` that reads as "no route".
 */
const PURCHASE_ROUTE: Record<Tier, TierBand> = {
  starter: 'self_serve',
  growth: 'self_serve',
  pro: 'self_serve',
  enterprise: 'enterprise',
};

/** Which band's mandate ladder collects this tier (`F1-18`, `BM-11`). */
export function tierBand(tier: Tier): TierBand {
  return PURCHASE_ROUTE[tier];
}

/**
 * One limit on one capacity kind. Three cases and no fourth: a number in that kind's own unit,
 * `unlimited` where the tier imposes no ceiling, and `custom` where the rung is negotiated
 * (`BM-15`). Both words are DECLARED rather than left as a missing field, so "this tier has no
 * ceiling" and "nobody authored this" can never be read as the same thing.
 */
export type TierLimit = number | 'unlimited' | 'custom';

/**
 * What a tier may CREATE per billing cycle (`BM-12`b). Two counts, and the product counts no
 * people among them: users are unlimited on every tier, and tracked field seats are a meter
 * rather than a headcount (`BM-04`, `BM-22`, `OV-30`). A person-count member added here is the
 * defect this closed list exists to make visible.
 */
export const COUNTED_CREATIONS = ['proposals', 'active_projects'] as const;

export type CountedCreation = (typeof COUNTED_CREATIONS)[number];

/**
 * The tier axis, in the four capacity kinds `BM-12` names and no fifth. Two tiers never differ in
 * what they can DO — a capability withheld by price is the defect `BM-05` forbids — so this shape
 * is the whole of what a rung buys.
 *
 * This is the market-neutral SHAPE; the values are book data carrying the market's own units
 * (`BM-37`, `T-FCORE-010`). That split is why nothing here is a currency and nothing here is a
 * number.
 *
 * A `Record` per kind, so a sixth meter or a third counted creation stops every book compiling
 * rather than leaving a rung silently unpriced.
 */
export interface TierCapacity {
  /**
   * (a) The single-design ceiling, in kW — the industry's own ladder, adopted so a buyer compares
   * rung for rung. A billing entitlement enforced at the save and generate boundaries, never a
   * clamp inside the design engine and never a mid-edit interruption (mechanics `M12`/`M05`).
   */
  readonly designCeilingKw: TierLimit;
  /** (b) What may be created per billing cycle, counted over the tenant's own anchor window. */
  readonly creationsPerCycle: Record<CountedCreation, TierLimit>;
  /** (c) The allowance per meter, before the book's published overage rate applies (`BM-17`). */
  readonly meterBundles: Record<Meter, TierLimit>;
  /** (d) The storage ceiling, in GB. Reads and exports are never storage-gated (`BM-20`). */
  readonly storageGb: TierLimit;
}
