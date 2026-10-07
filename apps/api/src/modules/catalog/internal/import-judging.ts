import {
  type CatalogImportRowMatch,
  catalogSpecSchema,
  effectiveImportCells,
  type ImportCatalog,
  type ImportCurrency,
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

/** What a row's match stores: its outcome, why it needs attention, and the item it names. */
export function verdictOf(
  row: { readonly rowNumber: number },
  match: CatalogImportRowMatch | undefined,
): RowVerdict {
  if (match === undefined) throw new Error(`row ${row.rowNumber} has no verdict`);
  return {
    outcome: match.outcome,
    attention: match.outcome === 'needs_attention' ? match.attention : [],
    catalogItemId: match.outcome === 'price_override' ? match.platformItemId : null,
    tenantCatalogItemId: match.outcome === 'own_item_price' ? match.ownItemId : null,
  };
}
