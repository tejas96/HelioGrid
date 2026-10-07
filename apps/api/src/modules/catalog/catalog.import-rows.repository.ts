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
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type ItemRate, itemRatesInForce, type RatedItem } from './catalog.rates.repository';
import { type WrittenRate, writtenRates } from './catalog.written-rates.repository';

/** One row as the matching pass judged it, ready to store. */
export interface JudgedRow {
  readonly rowNumber: number;
  readonly cells: CatalogImportCells;
  readonly outcome: CatalogImportRowOutcome;
  readonly attention: readonly ImportAttention[];
  readonly catalogItemId: string | null;
  readonly tenantCatalogItemId: string | null;
}

/** A row's verdict, as the matching pass stores it and a fix or a failed write replaces it. */
export type RowVerdict = Pick<
  JudgedRow,
  'outcome' | 'attention' | 'catalogItemId' | 'tenantCatalogItemId'
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
   * A page of the grid by sheet row number, narrowed to one outcome or one result when asked, each
   * matched row with the rate its item holds on `pricedOn` and each written row with its entries —
   * read once for the page, never per row.
   */
  async page(
    tenantId: string,
    jobId: string,
    page: {
      readonly outcome: CatalogImportRowOutcome | undefined;
      readonly result: CatalogImportRowResult | undefined;
      readonly limit: number;
      readonly offset: number;
      readonly pricedOn: string;
    },
  ): Promise<{ readonly rows: readonly PreviewRow[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const filter = and(
        eq(catalogImportRow.tenantId, tenantId),
        eq(catalogImportRow.jobId, jobId),
        page.outcome === undefined ? undefined : eq(catalogImportRow.outcome, page.outcome),
        page.result === undefined ? undefined : eq(catalogImportRow.result, page.result),
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
        rows: await withRates(tx, tenantId, rows, page.pricedOn),
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

/** One stored row, without the rates read beside it. */
export type StoredRow = Omit<PreviewRow, 'rate' | 'written'>;

/**
 * Each row with the rate its matched item holds on `pricedOn`, and each written row with the
 * entry it wrote and the one before it — read once for all of them.
 */
export async function withRates(
  tx: TenantScopedDb,
  tenantId: string,
  rows: readonly StoredRow[],
  pricedOn: string,
): Promise<PreviewRow[]> {
  const matched: RatedItem[] = rows.flatMap((row): RatedItem[] => {
    if (row.catalogItemId !== null) return [{ source: 'platform_item', id: row.catalogItemId }];
    if (row.tenantCatalogItemId !== null)
      return [{ source: 'own_item', id: row.tenantCatalogItemId }];
    return [];
  });
  const rates = await itemRatesInForce(tx, tenantId, matched, pricedOn);
  const written = await writtenRates(
    tx,
    tenantId,
    rows.flatMap((row) => (row.rateEntryId === null ? [] : [row.rateEntryId])),
  );
  return rows.map((row) => {
    const itemId = row.catalogItemId ?? row.tenantCatalogItemId;
    return {
      ...row,
      rate: itemId === null ? null : (rates.get(itemId) ?? null),
      written: row.rateEntryId === null ? null : (written.get(row.rateEntryId) ?? null),
    };
  });
}
