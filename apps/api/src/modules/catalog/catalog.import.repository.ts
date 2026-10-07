import { catalogImportWorkflow } from '@heliogrid/contracts/workflows';
import { catalogImportJob, type TenantPool, type TenantScopedDb, uuidv7 } from '@heliogrid/db';
import {
  CATALOG_IMPORT_MAPPABLE_STATES,
  type CatalogImportEntryPoint,
  type CatalogImportMapping,
  type CatalogImportSheet,
  type CatalogImportState,
  type CatalogImportUnreadableReason,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';

/** A job as the list reads it. */
export interface ImportJobSummary {
  readonly id: string;
  readonly entryPoint: CatalogImportEntryPoint;
  readonly status: CatalogImportState;
  readonly fileName: string;
  readonly savedAt: Date | null;
  readonly startedBy: string;
  readonly createdAt: Date;
}

/** A job as the one-job read and the steps read it. */
export interface ImportJobRow extends ImportJobSummary {
  readonly fileId: string;
  readonly unreadableReason: CatalogImportUnreadableReason | null;
  readonly sheets: readonly CatalogImportSheet[] | null;
  readonly mapping: CatalogImportMapping | null;
  readonly mappingRevision: number;
}

export interface ImportToStart {
  readonly fileId: string;
  readonly entryPoint: CatalogImportEntryPoint;
  readonly fileName: string;
  readonly savedAt: Date | null;
}

/** A started job, and the event to dispatch after the commit — none when a retry replayed it. */
export interface StartedImport {
  readonly jobId: string;
  readonly eventId: string | null;
}

/** What a read made of the file: its sheets, or why it could not be read. */
export type ReadOutcome =
  | { readonly sheets: readonly CatalogImportSheet[] }
  | { readonly unreadable: CatalogImportUnreadableReason };

/** What the list shows of a job — never its sheets, which only the one-job read returns. */
const summaryColumns = {
  id: catalogImportJob.id,
  entryPoint: catalogImportJob.entryPoint,
  status: catalogImportJob.status,
  fileName: catalogImportJob.fileName,
  savedAt: catalogImportJob.savedAt,
  startedBy: catalogImportJob.startedBy,
  createdAt: catalogImportJob.createdAt,
};

const jobColumns = {
  ...summaryColumns,
  fileId: catalogImportJob.fileId,
  unreadableReason: catalogImportJob.unreadableReason,
  sheets: catalogImportJob.sheets,
  mapping: catalogImportJob.mapping,
  mappingRevision: catalogImportJob.mappingRevision,
};

/** The import's jobs on the runtime pool, inside the tenant transaction (`T-M01-030`). */
@Injectable()
export class CatalogImportRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The job in `reading` and its handoff to the read step, committed together or not at all
   * (`infra/temporal/README.md` §5). A retried start with its key answers the job the first send
   * made and writes no second event (`F4-07`).
   */
  async start(
    tenantId: string,
    toStart: ImportToStart,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<StartedImport>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: catalogImportJob.id, fingerprint: catalogImportJob.creationFingerprint })
          .from(catalogImportJob)
          .where(
            and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.creationKey, key.key)),
          )
          .limit(1);
        if (made) return replayOf({ jobId: made.id, eventId: null }, made.fingerprint, key);
      }
      const jobId = uuidv7();
      const at = new Date(act.now);
      await tx.insert(catalogImportJob).values({
        id: jobId,
        tenantId,
        ...toStart,
        status: 'reading',
        startedBy: act.actorUserId,
        createdAt: at,
        updatedAt: at,
        creationKey: key?.key,
        creationFingerprint: key?.fingerprint,
      });
      const eventId = uuidv7();
      await recordOutboxEvent(tx, tenantId, catalogImportWorkflow, {
        eventId,
        tenantId,
        jobId,
        phase: 'read',
      });
      return { outcome: 'created', row: { jobId, eventId } };
    });
  }

  async find(tenantId: string, id: string): Promise<ImportJobRow | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select(jobColumns)
        .from(catalogImportJob)
        .where(and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, id)));
      return row ?? null;
    });
  }

  /** Newest first; the count is taken with the same filter. */
  async page(
    tenantId: string,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<{ readonly rows: readonly ImportJobSummary[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const mine = eq(catalogImportJob.tenantId, tenantId);
      const rows = await tx
        .select(summaryColumns)
        .from(catalogImportJob)
        .where(mine)
        .orderBy(desc(catalogImportJob.createdAt), desc(catalogImportJob.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(catalogImportJob)
        .where(mine);
      return { rows, totalCount: total?.value ?? 0 };
    });
  }

  /**
   * Records what the read made of the file — only while the job is still `reading`, so a retried
   * step writes nothing twice. Answers where the job is either way.
   */
  async recordRead(
    tenantId: string,
    id: string,
    outcome: ReadOutcome,
    now: number,
  ): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, (tx) =>
      moveFrom(tx, tenantId, id, 'reading', {
        ...('sheets' in outcome
          ? { status: 'mapped' as const, sheets: outcome.sheets }
          : { status: 'unreadable' as const, unreadableReason: outcome.unreadable }),
        updatedAt: new Date(now),
      }),
    );
  }

  /**
   * The confirmed mapping, the revision raised past `revision` (the one the service read), the job
   * `matching`, and the handoff to the match step — committed together or not at all. Null, and
   * nothing written, when the job has moved since it was read: out of a mappable state, or under
   * another mapping.
   */
  async confirmMapping(
    tenantId: string,
    id: string,
    mapping: CatalogImportMapping,
    revision: number,
    now: number,
  ): Promise<{ readonly eventId: string } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [moved] = await tx
        .update(catalogImportJob)
        .set({
          mapping,
          mappingRevision: revision + 1,
          status: 'matching',
          updatedAt: new Date(now),
        })
        .where(
          and(
            eq(catalogImportJob.tenantId, tenantId),
            eq(catalogImportJob.id, id),
            inArray(catalogImportJob.status, [...CATALOG_IMPORT_MAPPABLE_STATES]),
            eq(catalogImportJob.mappingRevision, revision),
          ),
        )
        .returning({ id: catalogImportJob.id });
      if (!moved) return null;
      const eventId = uuidv7();
      await recordOutboxEvent(tx, tenantId, catalogImportWorkflow, {
        eventId,
        tenantId,
        jobId: id,
        phase: 'match',
      });
      return { eventId };
    });
  }

  /**
   * A pass that failed past every retry puts a still-matching job back to `mapped`, so the wizard
   * offers the confirm again. Answers where the job is either way; null when it is not this
   * company's.
   */
  async endMatch(tenantId: string, id: string, now: number): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, (tx) =>
      moveFrom(tx, tenantId, id, 'matching', { status: 'mapped', updatedAt: new Date(now) }),
    );
  }
}

/**
 * Moves the job only while it is still `from`, so a retried step writes nothing twice; answers where
 * the job is either way, or null when it is not this company's.
 */
async function moveFrom(
  tx: TenantScopedDb,
  tenantId: string,
  id: string,
  from: CatalogImportState,
  to: Partial<typeof catalogImportJob.$inferInsert>,
): Promise<CatalogImportState | null> {
  const mine = and(eq(catalogImportJob.tenantId, tenantId), eq(catalogImportJob.id, id));
  const [moved] = await tx
    .update(catalogImportJob)
    .set(to)
    .where(and(mine, eq(catalogImportJob.status, from)))
    .returning({ status: catalogImportJob.status });
  if (moved) return moved.status;
  const [current] = await tx
    .select({ status: catalogImportJob.status })
    .from(catalogImportJob)
    .where(mine);
  return current?.status ?? null;
}
