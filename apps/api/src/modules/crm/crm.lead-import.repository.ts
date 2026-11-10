import { leadImportWorkflow } from '@heliogrid/contracts/workflows';
import { leadImport, type TenantPool, type TenantScopedDb, uuidv7 } from '@heliogrid/db';
import {
  CATALOG_IMPORT_MAPPABLE_STATES,
  type CatalogImportState,
  type CatalogImportUnreadableReason,
  type ImportDuplicateChoice,
  type ImportSheet,
  type LeadImportMapping,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordOutboxEvent } from '../../common/temporal/outbox.repository';

/** A lead import as the one-job read and the steps read it (`M02-18`…`M02-21`). */
export interface LeadImportJob {
  readonly id: string;
  readonly fileId: string;
  readonly status: CatalogImportState;
  readonly unreadableReason: CatalogImportUnreadableReason | null;
  readonly fileName: string;
  readonly savedAt: Date | null;
  readonly sheets: readonly ImportSheet[] | null;
  readonly mapping: LeadImportMapping | null;
  readonly mappingRevision: number;
  /** The run's choice, when and who; all three null until the job is run. */
  readonly duplicateChoice: ImportDuplicateChoice | null;
  readonly runAt: Date | null;
  readonly runBy: string | null;
  readonly startedBy: string;
  readonly createdAt: Date;
}

export interface LeadImportToStart {
  readonly fileId: string;
  readonly fileName: string;
  readonly savedAt: Date | null;
}

/** A started job, and the event to dispatch after the commit — none when a retry replayed it. */
export interface StartedLeadImport {
  readonly jobId: string;
  readonly eventId: string | null;
}

/** What a read made of the file: its sheets, or why it could not be read. */
export type LeadImportReadOutcome =
  | { readonly sheets: readonly ImportSheet[] }
  | { readonly unreadable: CatalogImportUnreadableReason };

const jobColumns = {
  id: leadImport.id,
  fileId: leadImport.fileId,
  status: leadImport.status,
  unreadableReason: leadImport.unreadableReason,
  fileName: leadImport.fileName,
  savedAt: leadImport.savedAt,
  sheets: leadImport.sheets,
  mapping: leadImport.mapping,
  mappingRevision: leadImport.mappingRevision,
  duplicateChoice: leadImport.duplicateChoice,
  runAt: leadImport.runAt,
  runBy: leadImport.runBy,
  startedBy: leadImport.startedBy,
  createdAt: leadImport.createdAt,
};

/**
 * The lead import's job on the runtime pool, inside the tenant transaction: its start, its read and
 * its confirmed mapping, each with the handoff to the `leadImport` workflow committed beside it.
 */
@Injectable()
export class CrmLeadImportRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /**
   * The job in `reading` and its handoff to the read step, committed together or not at all. A
   * retried start with its key answers the job the first send made and writes no second event.
   */
  async start(
    tenantId: string,
    toStart: LeadImportToStart,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<StartedLeadImport>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: leadImport.id, fingerprint: leadImport.creationFingerprint })
          .from(leadImport)
          .where(and(eq(leadImport.tenantId, tenantId), eq(leadImport.creationKey, key.key)))
          .limit(1);
        if (made) return replayOf({ jobId: made.id, eventId: null }, made.fingerprint, key);
      }
      const jobId = uuidv7();
      const at = new Date(act.now);
      await tx.insert(leadImport).values({
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
      const eventId = await handOff(tx, tenantId, jobId, 'read');
      return { outcome: 'created', row: { jobId, eventId } };
    });
  }

  async find(tenantId: string, id: string): Promise<LeadImportJob | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select(jobColumns)
        .from(leadImport)
        .where(and(eq(leadImport.tenantId, tenantId), eq(leadImport.id, id)));
      return row ?? null;
    });
  }

  /**
   * Records what the read made of the file — only while the job is still `reading`, so a retried
   * step writes nothing twice. Answers where the job is either way; null when not this company's.
   */
  async recordRead(
    tenantId: string,
    id: string,
    outcome: LeadImportReadOutcome,
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
   * `matching`, and the handoff to the preview pass — committed together or not at all. Null, and
   * nothing written, when the job has moved since it was read.
   */
  async confirmMapping(
    tenantId: string,
    id: string,
    mapping: LeadImportMapping,
    revision: number,
    now: number,
  ): Promise<{ readonly eventId: string } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [moved] = await tx
        .update(leadImport)
        .set({
          mapping,
          mappingRevision: revision + 1,
          status: 'matching',
          updatedAt: new Date(now),
        })
        .where(
          and(
            eq(leadImport.tenantId, tenantId),
            eq(leadImport.id, id),
            inArray(leadImport.status, [...CATALOG_IMPORT_MAPPABLE_STATES]),
            eq(leadImport.mappingRevision, revision),
          ),
        )
        .returning({ id: leadImport.id });
      if (!moved) return null;
      return { eventId: await handOff(tx, tenantId, id, 'match') };
    });
  }

  /** A preview pass that failed past every retry puts a still-matching job back to `mapped`. */
  async endMatch(tenantId: string, id: string, now: number): Promise<CatalogImportState | null> {
    return this.db.withTenantTransaction(tenantId, (tx) =>
      moveFrom(tx, tenantId, id, 'matching', { status: 'mapped', updatedAt: new Date(now) }),
    );
  }
}

/** The job's handoff to one phase of the `leadImport` workflow, in the caller's transaction. */
export async function handOff(
  tx: TenantScopedDb,
  tenantId: string,
  jobId: string,
  phase: 'read' | 'match' | 'run',
): Promise<string> {
  const eventId = uuidv7();
  await recordOutboxEvent(tx, tenantId, leadImportWorkflow, { eventId, tenantId, jobId, phase });
  return eventId;
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
  to: Partial<typeof leadImport.$inferInsert>,
): Promise<CatalogImportState | null> {
  const mine = and(eq(leadImport.tenantId, tenantId), eq(leadImport.id, id));
  const [moved] = await tx
    .update(leadImport)
    .set(to)
    .where(and(mine, eq(leadImport.status, from)))
    .returning({ status: leadImport.status });
  if (moved) return moved.status;
  const [current] = await tx.select({ status: leadImport.status }).from(leadImport).where(mine);
  return current?.status ?? null;
}

/** The job's state, its row locked for the caller's transaction; null when not this company's. */
export async function lockedLeadImport(tx: TenantScopedDb, tenantId: string, jobId: string) {
  const [job] = await tx
    .select({
      status: leadImport.status,
      mappingRevision: leadImport.mappingRevision,
      duplicateChoice: leadImport.duplicateChoice,
      runBy: leadImport.runBy,
    })
    .from(leadImport)
    .where(and(eq(leadImport.tenantId, tenantId), eq(leadImport.id, jobId)))
    .for('update');
  return job ?? null;
}
