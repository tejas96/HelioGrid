import { storageGaugeSnapshot, type TenantPool, usageEvent } from '@heliogrid/db';
import type { LedgerMeter } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

/** A half-open window of instants, `[from, to)`. */
export interface UsageWindow {
  readonly from: Date;
  readonly to: Date;
}

/** One meter's sum over a window: every unit, and the units that bill. */
export interface MeterSum {
  readonly meter: LedgerMeter;
  readonly total: number;
  readonly billed: number;
}

/** The latest nightly weight of a company's stored files. */
export interface StorageGauge {
  readonly gaugeBytes: number;
  readonly takenAt: Date;
}

/**
 * The ONE reader of the usage ledger and the storage gauge (`M12-32`, `M12-34`): the usage screen,
 * every gate, the invoice and the quotas read these two queries and nothing else — the Biome plugin
 * `usage-ledger-reader` refuses either table in any other file. On the tenant pool, the policy and
 * the predicate both, so a reader can only ever sum its own.
 */
@Injectable()
export class UsageRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The rollup, on `usage_event_tenant_meter_occurred_idx`. A meter with no row is absent. */
  async sumsOf(
    tenantId: string,
    meters: readonly LedgerMeter[],
    window: UsageWindow,
  ): Promise<MeterSum[]> {
    if (meters.length === 0) return [];
    return this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({
          meter: usageEvent.meter,
          total: sql<number>`sum(${usageEvent.quantity})`.mapWith(Number),
          billed:
            sql<number>`coalesce(sum(${usageEvent.quantity}) filter (where ${usageEvent.billable}), 0)`.mapWith(
              Number,
            ),
        })
        .from(usageEvent)
        .where(
          and(
            eq(usageEvent.tenantId, tenantId),
            inArray(usageEvent.meter, [...meters]),
            gte(usageEvent.occurredAt, window.from),
            lt(usageEvent.occurredAt, window.to),
          ),
        )
        .groupBy(usageEvent.meter),
    );
  }

  /** The newest snapshot, by the primary key's order; `null` before the first night. */
  async latestGauge(tenantId: string): Promise<StorageGauge | null> {
    const [row] = await this.db.withTenantTransaction(tenantId, (tx) =>
      tx
        .select({
          gaugeBytes: storageGaugeSnapshot.gaugeBytes,
          takenAt: storageGaugeSnapshot.takenAt,
        })
        .from(storageGaugeSnapshot)
        .where(eq(storageGaugeSnapshot.tenantId, tenantId))
        .orderBy(desc(storageGaugeSnapshot.snapshotDate))
        .limit(1),
    );
    return row ?? null;
  }
}
