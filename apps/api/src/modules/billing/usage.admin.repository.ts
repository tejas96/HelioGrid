import { type Db, file, storageGaugeSnapshot, tenant, usageEvent } from '@heliogrid/db';
import type { LedgerMeter, SubjectKind } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNotNull, sql } from 'drizzle-orm';
import { ADMIN_DB } from '../../common/db/admin.token';

/** One ledger row as its writer hands it over: the period key already derived from `occurredAt`. */
export interface LedgerRow {
  readonly tenantId: string;
  readonly meter: LedgerMeter;
  readonly quantity: number;
  readonly billable: boolean;
  readonly subjectKind: SubjectKind;
  readonly subjectRef: string;
  readonly idempotencyKey: string;
  readonly periodKey: string;
  readonly occurredAt: Date;
  readonly recordedAt: Date;
}

/**
 * The ledger's two writers, across every company: the outbox step's insert and the nightly gauge.
 * Neither ever updates a row; both make a repeat a no-op on the table's own unique key.
 */
@Injectable()
export class UsageAdminRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(ADMIN_DB) private readonly db: Db) {}

  /** `true` when this call wrote the row, `false` when the ledger already held it. */
  async record(row: LedgerRow): Promise<boolean> {
    const written = await this.db
      .insert(usageEvent)
      .values(row)
      .onConflictDoNothing({
        target: [
          usageEvent.tenantId,
          usageEvent.meter,
          usageEvent.idempotencyKey,
          usageEvent.periodKey,
        ],
      })
      .returning({ id: usageEvent.id });
    return written.length === 1;
  }

  /** One page of company ids, in id order after `after`, for the nightly gauge to weigh. */
  async companyPage(after: string | null, size: number): Promise<string[]> {
    const page = await this.db
      .select({ id: tenant.id })
      .from(tenant)
      .where(after === null ? undefined : gt(tenant.id, after))
      .orderBy(asc(tenant.id))
      .limit(size);
    return page.map(({ id }) => id);
  }

  /**
   * Weighs the named companies in one statement: each one's confirmed uploads summed on
   * `file_tenant_subject_idx`, 0 for a company with none. A document the platform made — an
   * invoice's PDF, no uploader — weighs nothing: a company is never billed for our own invoices. A second run on the same `snapshotDate`
   * writes nothing.
   */
  async weigh(ids: readonly string[], snapshotDate: string, takenAt: Date): Promise<void> {
    if (ids.length === 0) return;
    const weights = this.db
      .select({
        tenantId: tenant.id,
        snapshotDate: sql<string>`${snapshotDate}::date`.as('snapshot_date'),
        gaugeBytes: sql<number>`coalesce(sum(${file.byteSize}), 0)`.as('gauge_bytes'),
        takenAt: sql<Date>`${takenAt.toISOString()}::timestamptz`.as('taken_at'),
      })
      .from(tenant)
      .leftJoin(
        file,
        and(eq(file.tenantId, tenant.id), isNotNull(file.uploadedAt), isNotNull(file.uploadedBy)),
      )
      .where(inArray(tenant.id, [...ids]))
      .groupBy(tenant.id);
    await this.db.insert(storageGaugeSnapshot).select(weights).onConflictDoNothing();
  }
}
