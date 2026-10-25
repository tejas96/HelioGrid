import {
  type CatalogImportRowMatch,
  catalogSpecSchema,
  effectiveImportCells,
  type ImportCatalog,
  type ImportCurrency,
  type ImportNamedItem,
} from '@heliogrid/domain';
import type { RowVerdict, StoredRow } from '../catalog.import-rows.repository';
import type { NamedItem } from '../catalog.slice.repository';

/*
 * How a stored row is put to the matching pass — by the pass over a fixed group (`T-M01-030e`) and
 * by the run judging its batch again at the write (`T-M01-030f` decision 4), one way for both.
 */

/** A row's cells as it names its product: the person's typed value over the file's. */
export const namingCells = (row: StoredRow) => ({ cells: effectiveImportCells(row) });

/** A row as `matchImportRows` judges it: its cells as fixed, left out or not, and its answer. */
export const matchInput = (row: StoredRow) => ({
  cells: effectiveImportCells(row),
  leftOut: row.leftOut,
  answer: row.answer,
});

/** The items the rows named, as the matching pass reads a catalog, in the tenant's currency. */
export function catalogOf(named: readonly NamedItem[], currency: ImportCurrency): ImportCatalog {
  const entryOf = (row: NamedItem) => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    spec: catalogSpecSchema.parse(row.spec),
  });
  return {
    platformItems: named.filter((row) => row.source === 'platform_item').map(entryOf),
    ownItems: named.filter((row) => row.source === 'own_item').map(entryOf),
    currency,
  };
}

/** The items a match names: the one it writes to, or what its question is about. */
function namedItemsOf(match: CatalogImportRowMatch): readonly ImportNamedItem[] {
  switch (match.outcome) {
    case 'price_override':
      return [{ source: 'platform_item', id: match.platformItemId }];
    case 'own_item_price':
      return [{ source: 'own_item', id: match.ownItemId }];
    case 'new_item':
      return [];
    default:
      return match.named;
  }
}

/**
 * What a row's match stores: its outcome, why it needs attention, the item it writes to, the items
 * its name named and, on a repeat, the earlier row's number — `judged` is the group the pass ran
 * over, in its order, which the match's `repeats` indexes.
 */
export function verdictOf(
  row: { readonly rowNumber: number },
  match: CatalogImportRowMatch | undefined,
  judged: readonly { readonly rowNumber: number }[],
): RowVerdict {
  if (match === undefined) throw new Error(`row ${row.rowNumber} has no verdict`);
  const repeats = match.outcome === 'needs_attention' ? match.repeats : null;
  return {
    outcome: match.outcome,
    attention: match.outcome === 'needs_attention' ? match.attention : [],
    catalogItemId: match.outcome === 'price_override' ? match.platformItemId : null,
    tenantCatalogItemId: match.outcome === 'own_item_price' ? match.ownItemId : null,
    namedItems: namedItemsOf(match),
    repeatsRow: repeats === null ? null : (judged[repeats]?.rowNumber ?? null),
  };
}

/** A row is written again when anything its question or its write reads has moved. */
export function verdictMoved(before: RowVerdict, after: RowVerdict): boolean {
  return (
    before.outcome !== after.outcome ||
    before.catalogItemId !== after.catalogItemId ||
    before.tenantCatalogItemId !== after.tenantCatalogItemId ||
    before.repeatsRow !== after.repeatsRow ||
    !sameNamed(before.namedItems, after.namedItems) ||
    !sameAttention(before.attention, after.attention)
  );
}

function sameNamed(one: RowVerdict['namedItems'], other: RowVerdict['namedItems']): boolean {
  return (
    one.length === other.length &&
    one.every((item, index) => item.id === other[index]?.id && item.source === other[index]?.source)
  );
}

/**
 * Compared field by field, never as JSON text: a stored attention comes back from `jsonb` with its
 * keys reordered, so equal attention would read as changed.
 */
function sameAttention(one: RowVerdict['attention'], other: RowVerdict['attention']): boolean {
  return (
    one.length === other.length &&
    one.every((item, index) => {
      const twin = other[index];
      return (
        twin !== undefined &&
        item.reason === twin.reason &&
        item.fields.length === twin.fields.length &&
        item.fields.every((field, at) => field === twin.fields[at])
      );
    })
  );
}
