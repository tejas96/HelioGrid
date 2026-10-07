import type { OwnCatalogItemWrite } from '@heliogrid/contracts';
import { catalogImportWorkflow } from '@heliogrid/contracts/workflows';
import {
  catalogImportJob,
  catalogImportRow,
  type TenantPool,
  type TenantScopedDb,
  uuidv7,
} from '@heliogrid/db';
import {
  CATALOG_IMPORT_RUN_BATCH_ROWS,
  CATALOG_IMPORT_WRITTEN_OUTCOMES,
  type CatalogImportRowFailure,
  type CatalogImportRowResult,
  type CatalogImportState,
  type ImportProductName,
  takesImportRun,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, notInArray, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';
import { lockedJob, previewColumns, type StoredRow } from './catalog.import-rows.repository';
import { type PricedItem, priceItemIn } from './catalog.prices.repository';
import type { RateToAppend } from './catalog.rates.repository';
import { makeOwnItem } from './catalog.repository';
import { type NamedItem, namedIn } from './catalog.slice.repository';
import { lockCatalog } from './catalog.standing.repository';

/** What the run writes for one row, as judged again at the write (`T-M01-030f` decisions 3, 4). */
export type RowWrite =
  | {
      readonly rowNumber: number;
      readonly on: 'price';
      readonly item: PricedItem;
      readonly rate: RateToAppend;
    }
  | {
      readonly rowNumber: number;
      readonly on: 'new_item';
      readonly item: OwnCatalogItemWrite;
      readonly rate: RateToAppend;
    }
  | {
      readonly rowNumber: number;
      readonly on: 'nothing';
      readonly failure: CatalogImportRowFailure;
    };

/** One batch of a run, read under the job's and the catalog's locks. */
export interface RunBatch {
  readonly rows: readonly StoredRow[];
  /** The items naming these products in the tenant's market slice, as they stand under the lock. */
  named(names: readonly ImportProductName[]): Promise<readonly NamedItem[]>;
}

/** A started run, and the event to dispatch after the commit — or where the job already is. */
export type StartedRun = { readonly eventId: string } | { readonly status: CatalogImportState };

/** What a row's write left: its result, and the entry and SKU it made. */
interface RowResult {
  readonly rowNumber: number;
  readonly result: CatalogImportRowResult;
  readonly failure: CatalogImportRowFailure | null;
  readonly rateEntryId: string | null;
  readonly createdItemId: string | null;
}

/** The import's run on the runtime pool, inside the tenant transaction (`T-M01-030f`). */
@Injectable()
export class CatalogImportRunRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The job `running`, who ran it and when, every row the run will not write left out, and the
   * handoff to the run step — committed together or not at all. A job not previewed is answered
   * where it is and nothing is written; null when it is not this company's.
   */
  async start(tenantId: string, jobId: string, act: Act): Promise<StartedRun | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedJob(tx, tenantId, jobId);
      if (job === null) return null;
      if (!takesImportRun(job.status)) return { status: job.status };
      const at = new Date(act.now);
      await tx
        .update(catalogImportJob)
        .set({ status: 'running', runAt: at, runBy: act.actorUserId, updatedAt: at })
        .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, jobId)));
      await tx
        .update(catalogImportRow)
        .set({ result: 'left_out', updatedAt: at })
        .where(
          and(
            ofJob(tenantId, jobId),
            notInArray(catalogImportRow.outcome, [...CATALOG_IMPORT_WRITTEN_OUTCOMES]),
          ),
        );
      const eventId = uuidv7();
      await recordOutboxEvent(tx, tenantId, catalogImportWorkflow, {
        eventId,
        tenantId,
        jobId,
        phase: 'run',
      });
      return { eventId };
    });
  }

  /**
   * The run's next batch: the rows still without a result, in sheet order, written as `decide`
   * judges them, with their results — all in one transaction under the catalog lock, so a step run
   * again finds them done and a step that fails part way keeps nothing. The job completes with the
   * batch that leaves no row unwritten. Answers where the job is; null when not this company's.
   */
  async applyNext(
    tenantId: string,
    jobId: string,
    marketCode: string,
    act: Act,
    decide: (batch: RunBatch) => Promise<readonly RowWrite[]>,
  ): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedJob(tx, tenantId, jobId);
      if (job === null) return null;
      if (job.status !== 'running') return job.status;
      await lockCatalog(tx, tenantId);
      const rows = await tx
        .select(previewColumns)
        .from(catalogImportRow)
        .where(and(ofJob(tenantId, jobId), isNull(catalogImportRow.result)))
        .orderBy(asc(catalogImportRow.rowNumber))
        .limit(CATALOG_IMPORT_RUN_BATCH_ROWS);
      if (rows.length > 0) {
        const writes = await decide({
          rows,
          named: (names) => namedIn(tx, tenantId, marketCode, names),
        });
        const results: RowResult[] = [];
        for (const write of writes) results.push(await written(tx, tenantId, write, act));
        await recordResults(tx, tenantId, jobId, results, act.now);
      }
      if (rows.length === CATALOG_IMPORT_RUN_BATCH_ROWS) return 'running';
      await complete(tx, tenantId, jobId, act.now);
      return 'completed';
    });
  }

  /**
   * A run that failed past every retry: every row still unwritten is failed as never tried, and the
   * job completes. Answers where the job is; null when not this company's.
   */
  async end(tenantId: string, jobId: string, now: number): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const job = await lockedJob(tx, tenantId, jobId);
      if (job === null) return null;
      if (job.status !== 'running') return job.status;
      await tx
        .update(catalogImportRow)
        .set({ result: 'failed', failure: 'not_applied', updatedAt: new Date(now) })
        .where(and(ofJob(tenantId, jobId), isNull(catalogImportRow.result)));
      await complete(tx, tenantId, jobId, now);
      return 'completed';
    });
  }
}

const ofJob = (tenantId: string, jobId: string) =>
  and(eq(catalogImportRow.tenantId, tenantId), eq(catalogImportRow.jobId, jobId));

/** One row's catalog write and its audit entry, through the catalog's own writes (Law 5). */
async function written(
  tx: TenantScopedDb,
  tenantId: string,
  write: RowWrite,
  act: Act,
): Promise<RowResult> {
  const row = { rowNumber: write.rowNumber, failure: null, createdItemId: null };
  switch (write.on) {
    case 'price': {
      const rateEntryId = await priceItemIn(tx, tenantId, write.item, write.rate, act, null);
      return { ...row, result: 'price_applied', rateEntryId };
    }
    case 'new_item': {
      const made = await makeOwnItem(tx, tenantId, write.item, write.rate, act, null);
      return {
        ...row,
        result: 'product_created',
        rateEntryId: made.rateEntryId,
        createdItemId: made.id,
      };
    }
    case 'nothing':
      return { ...row, result: 'failed', failure: write.failure, rateEntryId: null };
  }
}

/** The batch's results, in one statement for every row given. */
async function recordResults(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
  results: readonly RowResult[],
  now: number,
): Promise<void> {
  if (results.length === 0) return;
  const values = results.map(
    (row) => sql`(
      ${row.rowNumber}::int, ${row.result}::catalog_import_row_result,
      ${row.failure}::catalog_import_row_failure, ${row.rateEntryId}::uuid, ${row.createdItemId}::uuid)`,
  );
  await tx.execute(sql`
    update catalog_import_row r set
      result = v.result, failure = v.failure, rate_entry_id = v.rate_entry_id,
      created_item_id = v.created_item_id,
      updated_at = ${new Date(now).toISOString()}::timestamptz
    from (values ${sql.join(values, sql`, `)}) as v(
      row_number, result, failure, rate_entry_id, created_item_id)
    where r.tenant_id = ${tenantId} and r.job_id = ${jobId} and r.row_number = v.row_number`);
}

async function complete(tx: TenantScopedDb, tenantId: string, jobId: string, now: number) {
  await tx
    .update(catalogImportJob)
    .set({ status: 'completed', updatedAt: new Date(now) })
    .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, jobId)));
}
