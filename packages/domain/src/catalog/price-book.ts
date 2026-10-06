import { type BasisPoints, basisPoints } from '../money/basis-points';

/**
 * The price book (`M01-48`): a tenant's rates for everything that is not a catalog item, kept as
 * immutable versions. Contracts derives its `z.enum` from the tuple and the database mirrors it as
 * a pgEnum, so a basis added here is added to both in the same change.
 */

/**
 * How a rate applies to a job — what Quick mode and the money block multiply it by. A rate's name
 * is the tenant's own words; its basis is this closed set, because ₹1,450 per kW and ₹1,450 per
 * job are different businesses (`SCR-M01-15`).
 */
export const PRICE_BOOK_RATE_BASES = ['per_job', 'per_kw', 'per_visit', 'per_metre'] as const;
export type PriceBookRateBasis = (typeof PRICE_BOOK_RATE_BASES)[number];

/**
 * The builder's starting margin for a company that has published no price-book version
 * (§M01.5, `M01-28`): with no version, nothing else supplies one.
 */
export const PLATFORM_DEFAULT_MARGIN: BasisPoints = basisPoints(1800);

/**
 * The highest margin the builder accepts (`M05-69`: editable 0–60). A version's default margin
 * above it would start every proposal at a margin the builder cannot hold.
 */
export const MAX_MARGIN: BasisPoints = basisPoints(6000);
