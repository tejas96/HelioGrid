import type { Meter } from './meters';

/**
 * What the platform pays for that a tenant never does — the other side of `METERS` (`BM-16`).
 *
 * Three closed lists, and each one exists because an absence would read as an oversight: a cost
 * the product promised to swallow, a capability it promised free, and an upstream whose bill
 * arrives here rather than at the tenant. None of them is a market fact, so none is a pack key.
 */

/**
 * `BM-24` — the absorbed-cost law. Costs too small or too structural to bill honestly are
 * swallowed and fair-use capped, never metered: OTP delivery (login and link-verification
 * messages) and the field-location ingestion behind check-in/out and visit logging (`BM-23`).
 *
 * Absorbed lines are still MEASURED internally for cost visibility — that measurement is `M12`'s
 * ledger, and it never reaches a tenant's bill. Fair-use enforcement, if ever exercised, follows
 * `§04.5`'s soft-block law rather than a silent degradation.
 *
 * The `satisfies` is the enforcement, not the comment: `Exclude<…, Meter>` drops any name that is
 * also a meter from the member type, so moving a line from absorbed to billed stops this file
 * compiling instead of quietly putting a bill on something the product promised to swallow.
 */
const ABSORBED_COST_NAMES = ['otp_delivery', 'field_location_ingestion'] as const;

export const ABSORBED_COSTS = ABSORBED_COST_NAMES satisfies readonly Exclude<
  (typeof ABSORBED_COST_NAMES)[number],
  Meter
>[];

export type AbsorbedCost = (typeof ABSORBED_COSTS)[number];

/**
 * `BM-19`, `BM-23` — capabilities that carry no meter and no tier gate, for every employee on
 * every tier. Manual roof outlining is the always-available alternative when a detection bundle
 * runs out, so a tenant out of bundle can keep working by hand (`BM-19`); site check-in/out and
 * visit logging are the core visit workflow and never need a tracked seat (`BM-23`).
 *
 * Declared rather than left implicit, because "no meter happens to name it" and "the product
 * promises it free" are different facts and only a list says the second out loud. A module about
 * to gate one of these has a name to check itself against first.
 */
export const NEVER_METERED = ['manual_roof_outline', 'site_check_in_out', 'visit_logging'] as const;

export type NeverMeteredCapability = (typeof NEVER_METERED)[number];

/**
 * `BM-25` — the externally priced calls the platform proxies. Each carries a per-call price from
 * its vendor, so a tenant driving one at runaway volume spends the PLATFORM's money; the server
 * proxies them with per-tenant metering and quotas so that cannot happen. The quota machinery is
 * platform ops (`M12`); this is the closed list of what it has to cover.
 *
 * There is deliberately no tenant-facing shape here and no configuration type anywhere in the
 * package: `BM-25` makes containment a platform duty and never a tenant surface, and a setting
 * that cannot be written cannot leak onto a screen.
 *
 * Which meter an upstream feeds is NOT recorded. `BM-25` names the upstreams and no row maps them
 * to meters; authoring the mapping here would be this package inventing a requirement.
 */
export const PROXIED_UPSTREAMS = ['solar_imagery', 'ai_extraction', 'speech'] as const;

export type ProxiedUpstream = (typeof PROXIED_UPSTREAMS)[number];

/**
 * `BM-25` — the free public sources, which cost nothing and are never billed. The energy source
 * of record is the one this product reads (`F8-08`).
 *
 * Its own list rather than an absence from `PROXIED_UPSTREAMS`: "free, so it needs no quota" and
 * "nobody has listed it yet" are different facts, and a reader deciding whether to meter a call
 * must be able to tell them apart.
 */
export const FREE_UPSTREAMS = ['energy_source_of_record'] as const;

export type FreeUpstream = (typeof FREE_UPSTREAMS)[number];
