import { catalogImportRow, type TenantScopedDb } from '@heliogrid/db';
import type { CatalogImportCells, ImportNamedItem } from '@heliogrid/domain';
import { and, eq, inArray } from 'drizzle-orm';
import { type NamedItem, namedIn } from './catalog.slice.repository';

/** The earlier row a repeat points at, as its question names it: its cells and the typed fix. */
export interface RepeatedRow {
  readonly rowNumber: number;
  readonly cells: CatalogImportCells;
  readonly fix: CatalogImportCells;
}

/** What a page's rows named (`T-M01-017`), read once for the page, never per row. */
export interface NamesOnPage {
  readonly items: ReadonlyMap<string, NamedItem>;
  readonly repeated: ReadonlyMap<number, RepeatedRow>;
}

/**
 * The items the rows named, by id, and the earlier rows their repeats point at — one statement
 * each, inside the caller's transaction and narrowed to this job by its tenant and id.
 */
export async function namesOnPage(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
  marketCode: string,
  rows: readonly {
    readonly namedItems: readonly ImportNamedItem[];
    readonly repeatsRow: number | null;
  }[],
): Promise<NamesOnPage> {
  const ids = rows.flatMap((row) => row.namedItems.map((item) => item.id));
  const items = await namedIn(tx, tenantId, marketCode, { ids });
  const repeatRows = [
    ...new Set(rows.flatMap((row) => (row.repeatsRow === null ? [] : [row.repeatsRow]))),
  ];
  const repeated =
    repeatRows.length === 0
      ? []
      : await tx
          .select({
            rowNumber: catalogImportRow.rowNumber,
            cells: catalogImportRow.cells,
            fix: catalogImportRow.fix,
          })
          .from(catalogImportRow)
          .where(
            and(
              eq(catalogImportRow.tenantId, tenantId),
              eq(catalogImportRow.jobId, jobId),
              inArray(catalogImportRow.rowNumber, repeatRows),
            ),
          );
  return {
    items: new Map(items.map((item) => [item.id, item])),
    repeated: new Map(repeated.map((row) => [row.rowNumber, row])),
  };
}
