import {
  type CalendarDate,
  type CatalogRateEntry,
  catalogSpecSchema,
  percentToBasisPoints,
  type ResolvedCatalogItem,
} from '@heliogrid/domain';
import { minorUnitsOfDecimal, resolveCatalogItem } from '@heliogrid/domain/server';
import type { SliceRow } from '../catalog.slice.repository';

/** The tenant facts one resolve reads: its day, its market's badged schemes, its currency's digits. */
export interface ResolveContext {
  readonly pricedOn: CalendarDate;
  readonly badgedSchemes: readonly string[];
  readonly minorUnitDigits: number;
}

/**
 * A stored row through the one resolver (`T-M01-037`; Law 11) — the spec parsed whole, so an
 * unknown key a newer release wrote is dropped (C11), and the stored decimal re-minted as minor
 * units. The pack's per-kind tax is `null` until block 7 authors it, so an unset tax reads absent
 * (`F8-01`).
 */
export function resolvedOf(row: SliceRow, context: ResolveContext): ResolvedCatalogItem {
  const { id, brand, model, certifications, preferred, archived } = row;
  const spec = catalogSpecSchema.parse(row.spec);
  const rates = row.rate === null ? [] : [rateEntryOf(row.rate, context.minorUnitDigits)];
  const shared = {
    pricedOn: context.pricedOn,
    packTaxRate: null,
    badgedSchemes: context.badgedSchemes,
  };
  if (row.source === 'own_item') {
    return resolveCatalogItem({
      ...shared,
      ownItem: { id, brand, model, spec, certifications, preferred, archived, rates },
    });
  }
  const { provenance, availability } = row;
  if (provenance === 'tenant_provided' || availability === null) {
    throw new Error(`platform item ${id} reads as an own SKU`);
  }
  return resolveCatalogItem({
    ...shared,
    platformItem: { id, brand, model, spec, provenance, availability, certifications, archived },
    override:
      row.overrideId === null
        ? null
        : {
            taxRate: row.taxPct === null ? null : percentToBasisPoints(row.taxPct),
            hidden: row.hidden,
            preferred,
            rates,
          },
  });
}

function rateEntryOf(
  stored: NonNullable<SliceRow['rate']>,
  minorUnitDigits: number,
): CatalogRateEntry {
  return {
    ...stored,
    amount: stored.amount === null ? null : minorUnitsOfDecimal(stored.amount, minorUnitDigits),
  };
}
