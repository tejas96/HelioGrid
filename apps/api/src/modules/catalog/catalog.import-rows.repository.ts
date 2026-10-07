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
  CatalogImportRowOutcome,
  CatalogImportState,
  ImportAttention,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { type ItemRate, itemRatesInForce, type RatedItem } from './catalog.rates.repository';

/** One row as the matching pass judged it, ready to store. */
export interface JudgedRow {
  readonly rowNumber: number;
  readonly cells: CatalogImportCells;
  readonly outcome: CatalogImportRowOutcome;
  readonly attention: readonly ImportAttention[];
  readonly catalogItemId: string | null;
  readonly tenantCatalogItemId: string | null;
}

/** One stored row as the preview grid reads it, with the rate its matched item holds today. */
export interface PreviewRow extends JudgedRow {
  readonly fix: CatalogImportCells;
  readonly leftOut: boolean;
  readonly answer: CatalogImportConflictAnswer | null;
  readonly rate: ItemRate | null;
}

/** Enough rows per statement that a long sheet takes few round trips, few enough for the bind limit. */
const ROWS_PER_INSERT = 500;

const previewColumns = {
  rowNumber: catalogImportRow.rowNumber,
  cells: catalogImportRow.cells,
  fix: catalogImportRow.fix,
  leftOut: catalogImportRow.leftOut,
  answer: catalogImportRow.answer,
  outcome: catalogImportRow.outcome,
  attention: catalogImportRow.attention,
  catalogItemId: catalogImportRow.catalogItemId,
  tenantCatalogItemId: catalogImportRow.tenantCatalogItemId,
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
      for (let start = 0; start < rows.length; start += ROWS_PER_INSERT) {
        await tx.insert(catalogImportRow).values(
          rows.slice(start, start + ROWS_PER_INSERT).map((row) => ({
            ...row,
            tenantId,
            jobId,
            fix: {},
            leftOut: false,
            createdAt: at,
            updatedAt: at,
          })),
        );
      }
      await tx
        .update(catalogImportJob)
        .set({ status: 'previewed', updatedAt: at })
        .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, jobId)));
      return 'previewed';
    });
  }

  /** The job's rows counted by outcome, for domain's `countImportMatches`. */
  async countsByOutcome(tenantId: string, jobId: string): Promise<CatalogImportOutcomeCounts> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const groups = await tx
        .select({ outcome: catalogImportRow.outcome, count: sql<number>`count(*)::int` })
        .from(catalogImportRow)
        .where(and(eq(catalogImportRow.tenantId, tenantId), eq(catalogImportRow.jobId, jobId)))
        .groupBy(catalogImportRow.outcome);
      return Object.fromEntries(groups.map((group) => [group.outcome, group.count]));
    });
  }

  /**
   * A page of the grid by sheet row number, narrowed to one outcome when asked, each matched row
   * with the rate its item holds on `pricedOn` — read once for the page, never per row.
   */
  async page(
    tenantId: string,
    jobId: string,
    page: {
      readonly outcome: CatalogImportRowOutcome | undefined;
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

async function lockedJob(tx: TenantScopedDb, tenantId: string, jobId: string) {
  const [job] = await tx
    .select({ status: catalogImportJob.status, mappingRevision: catalogImportJob.mappingRevision })
    .from(catalogImportJob)
    .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, jobId)))
    .for('update');
  return job ?? null;
}

type StoredPreviewRow = Omit<PreviewRow, 'rate'>;

/** Each row with the rate its matched item holds on `pricedOn`, read once for the page. */
async function withRates(
  tx: TenantScopedDb,
  tenantId: string,
  rows: readonly StoredPreviewRow[],
  pricedOn: string,
): Promise<PreviewRow[]> {
  const matched: RatedItem[] = rows.flatMap((row): RatedItem[] => {
    if (row.catalogItemId !== null) return [{ source: 'platform_item', id: row.catalogItemId }];
    if (row.tenantCatalogItemId !== null)
      return [{ source: 'own_item', id: row.tenantCatalogItemId }];
    return [];
  });
  const rates = await itemRatesInForce(tx, tenantId, matched, pricedOn);
  return rows.map((row) => {
    const itemId = row.catalogItemId ?? row.tenantCatalogItemId;
    return { ...row, rate: itemId === null ? null : (rates.get(itemId) ?? null) };
  });
}
