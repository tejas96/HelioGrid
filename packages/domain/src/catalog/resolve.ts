import type { Certification } from '../certification/pack';
import { holdsScheme } from '../certification/schemes';
import type { Resolved } from '../commerce/effective-settings';
import { type CalendarDate, isCalendarDate } from '../format/holidays';
import type { BasisPoints } from '../money/basis-points';
import type { MinorUnits } from '../money/minor-units';
import type { CatalogSpec } from './specs';
import type { CatalogAvailability, CatalogProvenanceLabel, CatalogSource } from './vocabulary';

/**
 * One catalog item as a tenant sees it on a date (M01-32, M01-37 — Law 11). The list and item
 * routes, the pickers, BOM and M06's component lines all read this, and nothing else decides which
 * price, tax or flag is in force. It hands out a money figure, so it is on `./server` alone (F4-04).
 * An amount keeps its entry's own currency: the one-currency law is held where an entry is written.
 */

/** One dated entry of a rate ledger (M01-44): the price of one unit, in the currency's minor units. */
export interface CatalogRateEntry {
  /** `null` is a cleared rate: from its date the item has no price, and the history stays. */
  readonly amount: MinorUnits | null;
  readonly currency: string;
  readonly effectiveOn: CalendarDate;
  /**
   * The ledger's insertion order, which settles two entries on one date. A timestamp cannot:
   * every row one transaction writes shares its `now()`.
   */
  readonly sequence: number;
}

/** The rate in force on a date, and the entry date it names (MS4-07's effective-from). */
export interface CatalogRate {
  readonly amount: MinorUnits;
  readonly currency: string;
  readonly effectiveOn: CalendarDate;
}

/** A platform item as the platform curates it: read-only to every tenant, and carrying no price. */
export interface PlatformCatalogItem {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
  readonly provenance: Exclude<CatalogProvenanceLabel, 'tenant_provided'>;
  readonly availability: CatalogAvailability;
  readonly certifications: readonly Certification[];
  readonly archived: boolean;
}

/** A tenant's sparse override on one platform item. Its ledger is the only price that item has. */
export interface CatalogOverride {
  /** `null` falls through to the pack. `0` is a rate — an exempt item — and wins. */
  readonly taxRate: BasisPoints | null;
  readonly hidden: boolean;
  readonly preferred: boolean;
  readonly rates: readonly CatalogRateEntry[];
}

/** A tenant's own SKU (M01-36): it resolves alone and shadows no platform item. */
export interface OwnCatalogItem {
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
  readonly certifications: readonly Certification[];
  readonly preferred: boolean;
  readonly archived: boolean;
  readonly rates: readonly CatalogRateEntry[];
}

interface ResolveContext {
  /** The day the output is priced for, on the tenant's clock (F1-10). */
  readonly pricedOn: CalendarDate;
  /** The market's tax rate for the item's kind (MS10-32); `null` until the pack authors that table. */
  readonly packTaxRate: BasisPoints | null;
  /** The schemes the market badges, in its order: `badgedSchemes(pack.certificationSchemes)`. */
  readonly badgedSchemes: readonly string[];
}

export type CatalogResolveInput = ResolveContext &
  (
    | { readonly platformItem: PlatformCatalogItem; readonly override: CatalogOverride | null }
    | { readonly ownItem: OwnCatalogItem }
  );

type TaxSource = Extract<CatalogSource, 'override' | 'pack'>;
type RateSource = Extract<CatalogSource, 'override' | 'own_item'>;

export interface ResolvedCatalogItem {
  readonly id: string;
  /** The tier the item itself is: its brand, model, spec and certifications come from it alone. */
  readonly source: Extract<CatalogSource, 'platform_item' | 'own_item'>;
  /** Printed as stored, in every language (F3-08). */
  readonly brand: string;
  readonly model: string;
  readonly spec: CatalogSpec;
  readonly provenance: CatalogProvenanceLabel;
  /** Stock state, which only the platform tracks: an own SKU carries none. */
  readonly availability: CatalogAvailability | null;
  /** Every scheme the item holds, badged or not — what M06's Generate gate reads. */
  readonly certifications: readonly Certification[];
  /** The schemes it holds that the market badges, in the market's order (M01-34). */
  readonly badges: readonly string[];
  readonly tax: Resolved<BasisPoints, TaxSource> | null;
  readonly rate: Resolved<CatalogRate, RateSource> | null;
  /** Leaves pickers only; history still resolves the item. */
  readonly hidden: boolean;
  readonly preferred: boolean;
  /** Leaves pickers and search defaults; every existing reference still resolves (M01-42). */
  readonly archived: boolean;
}

export function resolveCatalogItem(input: CatalogResolveInput): ResolvedCatalogItem {
  const { pricedOn, packTaxRate, badgedSchemes } = input;
  requireCalendarDate(pricedOn);
  if ('ownItem' in input) {
    const { ownItem } = input;
    return {
      id: ownItem.id,
      source: 'own_item',
      brand: ownItem.brand,
      model: ownItem.model,
      spec: ownItem.spec,
      provenance: 'tenant_provided',
      availability: null,
      certifications: ownItem.certifications,
      badges: badgesHeld(ownItem.certifications, badgedSchemes),
      tax: packTax(packTaxRate),
      rate: rateInForce('own_item', ownItem.rates, pricedOn),
      hidden: false,
      preferred: ownItem.preferred,
      archived: ownItem.archived,
    };
  }
  const { platformItem, override } = input;
  return {
    id: platformItem.id,
    source: 'platform_item',
    brand: platformItem.brand,
    model: platformItem.model,
    spec: platformItem.spec,
    provenance: platformItem.provenance,
    availability: platformItem.availability,
    certifications: platformItem.certifications,
    badges: badgesHeld(platformItem.certifications, badgedSchemes),
    tax:
      override !== null && override.taxRate !== null
        ? { source: 'override', value: override.taxRate }
        : packTax(packTaxRate),
    rate: override === null ? null : rateInForce('override', override.rates, pricedOn),
    hidden: override?.hidden ?? false,
    preferred: override?.preferred ?? false,
    archived: platformItem.archived,
  };
}

function packTax(rate: BasisPoints | null): Resolved<BasisPoints, TaxSource> | null {
  return rate === null ? null : { source: 'pack', value: rate };
}

/** A scheme the pack stopped declaring keeps its certification and loses only its badge. */
function badgesHeld(held: readonly Certification[], badged: readonly string[]): readonly string[] {
  return badged.filter((scheme) => holdsScheme(held, scheme));
}

/**
 * The newest entry on or before the date, whatever order the ledger arrives in. A date before the
 * first entry has no rate, and a cleared entry resolves to none.
 */
function rateInForce(
  source: RateSource,
  rates: readonly CatalogRateEntry[],
  pricedOn: CalendarDate,
): Resolved<CatalogRate, RateSource> | null {
  let inForce: CatalogRateEntry | null = null;
  for (const entry of rates) {
    requireCalendarDate(entry.effectiveOn);
    if (entry.effectiveOn > pricedOn) continue;
    if (inForce === null || isNewer(entry, inForce)) inForce = entry;
  }
  if (inForce === null || inForce.amount === null) return null;
  const { amount, currency, effectiveOn } = inForce;
  return { source, value: { amount, currency, effectiveOn } };
}

/**
 * Days are compared as text, which is date order only for `YYYY-MM-DD`: a day in any other form
 * would price the wrong entry, so it is refused rather than compared.
 */
function requireCalendarDate(day: CalendarDate): void {
  if (!isCalendarDate(day)) throw new RangeError(`a day is YYYY-MM-DD, not ${day}`);
}

/** On one date, the later-recorded entry is the newer. */
function isNewer(entry: CatalogRateEntry, than: CatalogRateEntry): boolean {
  return entry.effectiveOn === than.effectiveOn
    ? entry.sequence > than.sequence
    : entry.effectiveOn > than.effectiveOn;
}
