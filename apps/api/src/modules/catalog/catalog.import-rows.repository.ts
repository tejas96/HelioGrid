import {
  catalogImportJob,
  catalogImportRow,
  type TenantPool,
  type TenantScopedDb,
} from '@heliogrid/db';
import type {
  CatalogImportCells,
  CatalogImportConflictAnswer,
  CatalogImportOutcomeCounts,
  CatalogImportResultCounts,
  CatalogImportRowFailure,
  CatalogImportRowOutcome,
  CatalogImportRowResult,
  CatalogImportState,
  ImportAttention,
  ImportNamedItem,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { namesOnPage, type RepeatedRow } from './catalog.import-row-names.repository';
import { type ItemRate, itemRatesInForce, type RatedItem } from './catalog.rates.repository';
import type { NamedItem } from './catalog.slice.repository';
import { type WrittenRate, writtenRates } from './catalog.written-rates.repository';

/** One row as the matching pass judged it, ready to store. */
export interface JudgedRow {
  readonly rowNumber: number;
  readonly cells: CatalogImportCells;
  readonly outcome: CatalogImportRowOutcome;
  readonly attention: readonly ImportAttention[];
  readonly catalogItemId: string | null;
  readonly tenantCatalogItemId: string | null;
  readonly namedItems: readonly ImportNamedItem[];
  readonly repeatsRow: number | null;
}

/** A row's verdict, as the matching pass stores it and a fix or a failed write replaces it. */
export type RowVerdict = Pick<
  JudgedRow,
  'outcome' | 'attention' | 'catalogItemId' | 'tenantCatalogItemId' | 'namedItems' | 'repeatsRow'
>;

/**
 * One stored row as the preview grid and the report read it: the rate its matched item holds
 * today, and once the run wrote it, the entry it wrote and the one before (`T-M01-030g`).
 */
export interface PreviewRow extends JudgedRow {
  readonly fix: CatalogImportCells;
  readonly leftOut: boolean;
  readonly answer: CatalogImportConflictAnswer | null;
  readonly result: CatalogImportRowResult | null;
  readonly failure: CatalogImportRowFailure | null;
  readonly rateEntryId: string | null;
  readonly rate: ItemRate | null;
  readonly written: WrittenRate | null;
  /** The items the row named, as its question names them. */
  readonly named: readonly NamedItem[];
  /** The earlier row a `repeated_in_file` row points at. */
  readonly repeats: RepeatedRow | null;
}

/** Enough rows per statement that a long sheet takes few round trips, few enough for the bind limit. */
const ROWS_PER_INSERT = 500;

/** A stored row's columns, as the grid and a fix read it. */
export const previewColumns = {
  rowNumber: catalogImportRow.rowNumber,
  cells: catalogImportRow.cells,
  fix: catalogImportRow.fix,
  leftOut: catalogImportRow.leftOut,
  answer: catalogImportRow.answer,
  outcome: catalogImportRow.outcome,
  attention: catalogImportRow.attention,
  catalogItemId: catalogImportRow.catalogItemId,
  tenantCatalogItemId: catalogImportRow.tenantCatalogItemId,
  namedItems: catalogImportRow.namedItems,
  repeatsRow: catalogImportRow.repeatsRow,
  result: catalogImportRow.result,
  failure: catalogImportRow.failure,
  rateEntryId: catalogImportRow.rateEntryId,
};

/** The import's rows on the runtime pool, inside the tenant transaction (`T-M01-030d`). */
@Injectable()
export class CatalogImportRowsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The pass's rows in place of any earlier mapping's, and the job `previewed` — only while the job
   * is still matching by the mapping this pass read. The job row is locked first, so a mapping
   * confirmed meanwhile waits and then supersedes, or has already and this pass writes nothing.
   * Answers where the job is either way; null when it is not this company's.
   */
  async replace(
    tenantId: string,
    jobId: string,
    revision: number,
    rows: readonly JudgedRow[],
    now: number,
  ): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedJob(tx, tenantId, jobId);
      if (job === null) return null;
      if (job.status !== 'matching' || job.mappingRevision !== revision) return job.status;
      const mine = and(eq(catalogImportRow.tenantId, tenantId), eq(catalogImportRow.jobId, jobId));
      await tx.delete(catalogImportRow).where(mine);
      const at = new Date(now);
      await inBatches(rows, async (batch) => {
        await tx.insert(catalogImportRow).values(
          batch.map((row) => ({
            ...row,
            tenantId,
            jobId,
            fix: {},
            leftOut: false,
            createdAt: at,
            updatedAt: at,
          })),
        );
      });
      await tx
        .update(catalogImportJob)
        .set({ status: 'previewed', updatedAt: at })
        .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, jobId)));
      return 'previewed';
    });
  }

  /** The job's rows counted by outcome, for domain's `countImportMatches`. */
  async countsByOutcome(tenantId: string, jobId: string): Promise<CatalogImportOutcomeCounts> {
    return this.db.withTenantTransaction(tenantId, (tx) => countsIn(tx, tenantId, jobId));
  }

  /**
   * The job's rows counted by what the run did with them — a row it has still to write counted as
   * `pending` — for domain's `importRunProgress` and `countImportResults`.
   */
  async countsByResult(tenantId: string, jobId: string): Promise<CatalogImportResultCounts> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const groups = await tx
        .select({ result: catalogImportRow.result, count: sql<number>`count(*)::int` })
        .from(catalogImportRow)
        .where(and(eq(catalogImportRow.tenantId, tenantId), eq(catalogImportRow.jobId, jobId)))
        .groupBy(catalogImportRow.result);
      return Object.fromEntries(groups.map((group) => [group.result ?? 'pending', group.count]));
    });
  }

  /**
   * A page of the grid by sheet row number, narrowed to the outcomes or results asked and to the
   * rows a cell of which holds the search, each row as the grid shows it — read once for the page,
   * never per row.
   */
  async page(
    tenantId: string,
    jobId: string,
    page: {
      readonly outcomes: readonly CatalogImportRowOutcome[] | undefined;
      readonly results: readonly CatalogImportRowResult[] | undefined;
      readonly search: string | undefined;
      readonly limit: number;
      readonly offset: number;
      readonly shownOn: ShownOn;
    },
  ): Promise<{ readonly rows: readonly PreviewRow[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const filter = and(
        eq(catalogImportRow.tenantId, tenantId),
        eq(catalogImportRow.jobId, jobId),
        page.outcomes === undefined
          ? undefined
          : inArray(catalogImportRow.outcome, [...page.outcomes]),
        page.results === undefined
          ? undefined
          : inArray(catalogImportRow.result, [...page.results]),
        page.search === undefined ? undefined : cellsHold(page.search),
      );
      const rows = await tx
        .select(previewColumns)
        .from(catalogImportRow)
        .where(filter)
        .orderBy(asc(catalogImportRow.rowNumber))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(catalogImportRow)
        .where(filter);
      return {
        rows: await asShown(tx, tenantId, jobId, rows, page.shownOn),
        totalCount: total?.value ?? 0,
      };
    });
  }
}

/** The rows in batches of `ROWS_PER_INSERT`, one statement each, in order. */
export async function inBatches<T>(
  rows: readonly T[],
  write: (batch: readonly T[]) => Promise<void>,
): Promise<void> {
  for (let start = 0; start < rows.length; start += ROWS_PER_INSERT) {
    await write(rows.slice(start, start + ROWS_PER_INSERT));
  }
}

/** The job's rows counted by outcome, inside the caller's transaction. */
export async function countsIn(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
): Promise<CatalogImportOutcomeCounts> {
  const groups = await tx
    .select({ outcome: catalogImportRow.outcome, count: sql<number>`count(*)::int` })
    .from(catalogImportRow)
    .where(and(eq(catalogImportRow.tenantId, tenantId), eq(catalogImportRow.jobId, jobId)))
    .groupBy(catalogImportRow.outcome);
  return Object.fromEntries(groups.map((group) => [group.outcome, group.count]));
}

/** The job's state, its row locked for the caller's transaction; null when not this company's. */
export async function lockedJob(tx: TenantScopedDb, tenantId: string, jobId: string) {
  const [job] = await tx
    .select({ status: catalogImportJob.status, mappingRevision: catalogImportJob.mappingRevision })
    .from(catalogImportJob)
    .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, jobId)))
    .for('update');
  return job ?? null;
}

/** One stored row, without what is read beside it. */
export type StoredRow = Omit<PreviewRow, 'rate' | 'written' | 'named' | 'repeats'>;

/** The day the grid prices on, and the market whose items the rows named. */
export interface ShownOn {
  readonly pricedOn: string;
  readonly marketCode: string;
}

/**
 * The item whose rate a row shows: the one it matched, else the one item its name named — so a
 * left-out row's report reads the price its product held (D129). Several candidates name none.
 */
function pricedItemOf(row: StoredRow): RatedItem | null {
  if (row.catalogItemId !== null) return { source: 'platform_item', id: row.catalogItemId };
  if (row.tenantCatalogItemId !== null) return { source: 'own_item', id: row.tenantCatalogItemId };
  const [only, ...more] = row.namedItems;
  return only === undefined || more.length > 0 ? null : only;
}

/**
 * A search over a row's cells' values — the file's and the typed fix's — case-insensitive, its
 * `%`, `_` and `\` taken as written; never a key name, so *rate* finds no row for its column.
 */
function cellsHold(search: string): SQL {
  const pattern = `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
  return sql`exists (select 1 from jsonb_each_text(${catalogImportRow.cells} || ${catalogImportRow.fix}) as cell
    where cell.value ilike ${pattern})`;
}

/**
 * Each row as the grid shows it: the rate its item holds on `pricedOn`, each written row's entry and
 * the one before it, the items it named and the row it repeats — read once for all of them.
 */
export async function asShown(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
  rows: readonly StoredRow[],
  shownOn: ShownOn,
): Promise<PreviewRow[]> {
  const priced = rows.map(pricedItemOf);
  const rates = await itemRatesInForce(
    tx,
    tenantId,
    priced.flatMap((item) => (item === null ? [] : [item])),
    shownOn.pricedOn,
  );
  const names = await namesOnPage(tx, tenantId, jobId, shownOn.marketCode, rows);
  const written = await writtenRates(
    tx,
    tenantId,
    rows.flatMap((row) => (row.rateEntryId === null ? [] : [row.rateEntryId])),
  );
  return rows.map((row, index) => {
    const itemId = priced[index]?.id ?? null;
    return {
      ...row,
      rate: itemId === null ? null : (rates.get(itemId) ?? null),
      written: row.rateEntryId === null ? null : (written.get(row.rateEntryId) ?? null),
      named: row.namedItems.flatMap((item) => names.items.get(item.id) ?? []),
      repeats: row.repeatsRow === null ? null : (names.repeated.get(row.repeatsRow) ?? null),
    };
  });
}
