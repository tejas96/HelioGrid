import type { AuditLogEntry, Paginated } from '@heliogrid/contracts';
import { auditLogEntry, type Db, withTenantTransaction } from '@heliogrid/db';
import type {
  AuditActorKind,
  AuditChangePayload,
  AuditEventType,
  AuditSubjectKind,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { RUNTIME_DB } from '../../common/db/runtime.token';

/** Any transaction, on either pool: an entry rides the one that carries its change. */
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * One act, as the log will record it (`F2-22`). The caller states the tenant whose log it is —
 * for an auth act, the company the session acts under — because both pools write here and only
 * the caller knows it.
 */
export interface AuditEntryToWrite {
  readonly tenantId: string;
  readonly eventType: AuditEventType;
  readonly actorKind: AuditActorKind;
  readonly actorRef: string;
  readonly occurredAt: Date;
  /** The act was REFUSED and nothing changed (`F2-19`). */
  readonly blocked: boolean;
  readonly subjectKind: AuditSubjectKind;
  readonly subjectRef: string;
  readonly changePayload: AuditChangePayload | null;
}

/**
 * Writes one entry ON THE CALLER'S TRANSACTION (`F2-22`: written with the change that caused
 * them, never reconstructed after the fact). It opens no connection of its own, so the entry and
 * its change commit together or neither does — and a blocked attempt, which changed nothing,
 * still commits its own record.
 */
export async function recordAuditEntry(tx: Tx, entry: AuditEntryToWrite): Promise<void> {
  await tx.insert(auditLogEntry).values(entry);
}

/**
 * The tenant's own log, read back (`F2-23`). One tenant's entries and no other's: the runtime
 * pool under the table's policy, with the tenant predicate in the query as well — tenancy is
 * defence in depth, all three always.
 */
@Injectable()
export class AuditRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(RUNTIME_DB) private readonly db: Db) {}

  async entries(
    tenantId: string,
    page: { limit: number; offset: number },
  ): Promise<Paginated<AuditLogEntry>> {
    return withTenantTransaction(this.db, tenantId, async (tx) => {
      const where = eq(auditLogEntry.tenantId, tenantId);
      const rows = await tx
        .select({
          id: auditLogEntry.id,
          eventType: auditLogEntry.eventType,
          actorKind: auditLogEntry.actorKind,
          actorRef: auditLogEntry.actorRef,
          occurredAt: auditLogEntry.occurredAt,
          blocked: auditLogEntry.blocked,
          subjectKind: auditLogEntry.subjectKind,
          subjectRef: auditLogEntry.subjectRef,
          changePayload: auditLogEntry.changePayload,
        })
        .from(auditLogEntry)
        .where(where)
        // Newest first, over the (tenant_id, occurred_at desc) index; the id breaks a tie so a
        // page boundary cannot show one entry twice and hide another.
        .orderBy(desc(auditLogEntry.occurredAt), desc(auditLogEntry.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ n: count() }).from(auditLogEntry).where(where);
      return {
        items: rows.map((row) => ({
          ...row,
          occurredAt: row.occurredAt.toISOString(),
          changePayload: toChangePayload(row.changePayload),
        })),
        totalCount: total?.n ?? 0,
      };
    });
  }
}

/** The stored envelope as the wire declares it: domain holds the sets readonly, the body does not. */
function toChangePayload(stored: AuditChangePayload | null): AuditLogEntry['changePayload'] {
  return stored === null ? null : { from: [...stored.from], to: [...stored.to] };
}
