import { catalogImportRow, type TenantPool, type TenantScopedDb } from '@heliogrid/db';
import type {
  CatalogImportOutcomeCounts,
  CatalogImportState,
  ImportProductName,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import {
  countsIn,
  inBatches,
  lockedJob,
  type PreviewRow,
  previewColumns,
  type StoredRow,
  withRates,
} from './catalog.import-rows.repository';
import { type NamedItem, namedIn } from './catalog.slice.repository';

/**
 * A cell as the row is judged by it: the person's typed value over the file's. It must say what
 * domain's `effectiveImportCells` says, or the group read misses rows the pass would count.
 */
const effective = (field: 'brand' | 'model') =>
  sql<string>`coalesce(${catalogImportRow.fix} ->> ${field}, ${catalogImportRow.cells} ->> ${field})`;

/**
 * One import job held for a fix (`T-M01-030e`): every read and the one write run in the
 * transaction that locked the job's row, so two fixes queue and a new mapping waits behind one.
 */
export interface LockedImport {
  readonly status: CatalogImportState;
  row(rowNumber: number): Promise<StoredRow | null>;
  /**
   * The rows that may name one of these products — every row that does, and perhaps some that
   * only contain the names. The caller keeps the exact ones by domain's identity: Postgres trims
   * no spaces the way the matching pass does.
   */
  naming(names: readonly ImportProductName[]): Promise<readonly StoredRow[]>;
  named(marketCode: string, names: readonly ImportProductName[]): Promise<readonly NamedItem[]>;
  /** The rows' fixes and verdicts, one statement per batch. */
  write(rows: readonly StoredRow[], now: number): Promise<void>;
  /** These rows by row number, each with the rate its matched item holds on `pricedOn`. */
  rows(rowNumbers: readonly number[], pricedOn: string): Promise<PreviewRow[]>;
  counts(): Promise<CatalogImportOutcomeCounts>;
}

/** A fix's transaction on the runtime pool, inside the tenant's scope. */
@Injectable()
export class CatalogImportFixRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The work with the job locked; null, and nothing run, when the job is not this company's. */
  async inLockedJob<T>(
    tenantId: string,
    jobId: string,
    work: (job: LockedImport) => Promise<T>,
  ): Promise<T | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedJob(tx, tenantId, jobId);
      if (job === null) return null;
      return work(lockedImport(tx, tenantId, jobId, job.status));
    });
  }
}

function lockedImport(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
  status: CatalogImportState,
): LockedImport {
  const ofJob = and(eq(catalogImportRow.tenantId, tenantId), eq(catalogImportRow.jobId, jobId));
  return {
    status,
    async row(rowNumber) {
      const [row] = await tx
        .select(previewColumns)
        .from(catalogImportRow)
        .where(and(ofJob, eq(catalogImportRow.rowNumber, rowNumber)));
      return row ?? null;
    },
    async naming(names) {
      if (names.length === 0) return [];
      const named = names.map(({ brand, model }) =>
        and(
          sql`strpos(${effective('brand')}, ${brand}) > 0`,
          sql`strpos(${effective('model')}, ${model}) > 0`,
        ),
      );
      return tx
        .select(previewColumns)
        .from(catalogImportRow)
        .where(and(ofJob, or(...named)))
        .orderBy(asc(catalogImportRow.rowNumber));
    },
    named: (marketCode, names) => namedIn(tx, tenantId, marketCode, names),
    async write(rows, now) {
      await inBatches(rows, (batch) => writeVerdicts(tx, tenantId, jobId, batch, now));
    },
    async rows(rowNumbers, pricedOn) {
      if (rowNumbers.length === 0) return [];
      const rows = await tx
        .select(previewColumns)
        .from(catalogImportRow)
        .where(and(ofJob, inArray(catalogImportRow.rowNumber, [...rowNumbers])))
        .orderBy(asc(catalogImportRow.rowNumber));
      return withRates(tx, tenantId, rows, pricedOn);
    },
    counts: () => countsIn(tx, tenantId, jobId),
  };
}

/** The rows' fixes and verdicts, in one statement for every row given. */
async function writeVerdicts(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
  rows: readonly StoredRow[],
  now: number,
): Promise<void> {
  const values = rows.map(
    (row) => sql`(
      ${row.rowNumber}::int, ${JSON.stringify(row.fix)}::jsonb, ${row.leftOut}::boolean,
      ${row.answer}::catalog_import_conflict_answer, ${row.outcome}::catalog_import_row_outcome,
      ${JSON.stringify(row.attention)}::jsonb, ${row.catalogItemId}::uuid,
      ${row.tenantCatalogItemId}::uuid)`,
  );
  await tx.execute(sql`
    update catalog_import_row r set
      fix = v.fix, left_out = v.left_out, answer = v.answer, outcome = v.outcome,
      attention = v.attention, catalog_item_id = v.catalog_item_id,
      tenant_catalog_item_id = v.tenant_catalog_item_id,
      updated_at = ${new Date(now).toISOString()}::timestamptz
    from (values ${sql.join(values, sql`, `)}) as v(
      row_number, fix, left_out, answer, outcome, attention, catalog_item_id,
      tenant_catalog_item_id)
    where r.tenant_id = ${tenantId} and r.job_id = ${jobId} and r.row_number = v.row_number`);
}
