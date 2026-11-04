import {
  storageGaugeSnapshot,
  type TenantPool,
  tenantMembership,
  usageEvent,
  userAccount,
} from '@heliogrid/db';
import { isBilledMeter, type LedgerMeter } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
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

/** One ledger row as the usage screen's events panel lists it. */
export interface LedgerEventRow {
  readonly id: string;
  readonly occurredAt: Date;
  readonly quantity: number;
  /** The name of the person a `user_account` subject points at, in this company; else null. */
  readonly person: string | null;
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
        .where(this.inWindow(tenantId, meters, window))
        .groupBy(usageEvent.meter),
    );
  }

  /**
   * The moment a meter's running total in the window first reached `threshold` units — when a
   * capped count became full (`capStepOf`'s `fullSince`) — or `null` while it has not. The running
   * sum walks `usage_event_tenant_meter_occurred_idx` in order and stops at the first row that
   * reaches it.
   */
  async crossedAt(
    tenantId: string,
    meter: LedgerMeter,
    window: UsageWindow,
    threshold: number,
  ): Promise<Date | null> {
    const running = sql<number>`sum(${usageEvent.quantity}) over (order by ${usageEvent.occurredAt}, ${usageEvent.id})`;
    const [row] = await this.db.withTenantTransaction(tenantId, (tx) => {
      const totals = tx
        .select({ occurredAt: usageEvent.occurredAt, total: running.as('total') })
        .from(usageEvent)
        // Billable rows only: the cap counts what bills, as `sumsOf`'s billed total does.
        .where(and(this.inWindow(tenantId, [meter], window), eq(usageEvent.billable, true)))
        .as('totals');
      return tx
        .select({ occurredAt: totals.occurredAt })
        .from(totals)
        .where(gte(totals.total, threshold))
        .orderBy(asc(totals.occurredAt))
        .limit(1);
    });
    return row?.occurredAt ?? null;
  }

  /**
   * One page of a meter's events in the window, newest first, the id a unique tiebreak; the count
   * runs over the same where. A `user_account` subject is named by the person's own name.
   */
  async eventsOf(
    tenantId: string,
    meter: LedgerMeter,
    window: UsageWindow,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<{ rows: LedgerEventRow[]; totalCount: number }> {
    // A billed meter lists the rows its figure adds up; a cost line's rows never bill.
    const where = isBilledMeter(meter)
      ? and(this.inWindow(tenantId, [meter], window), eq(usageEvent.billable, true))
      : this.inWindow(tenantId, [meter], window);
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await tx
        .select({
          id: usageEvent.id,
          occurredAt: usageEvent.occurredAt,
          quantity: usageEvent.quantity,
          person: userAccount.name,
        })
        .from(usageEvent)
        .leftJoin(
          tenantMembership,
          and(
            eq(usageEvent.subjectKind, 'user_account'),
            eq(tenantMembership.tenantId, usageEvent.tenantId),
            eq(tenantMembership.userAccountId, usageEvent.subjectRef),
          ),
        )
        .leftJoin(userAccount, eq(userAccount.id, tenantMembership.userAccountId))
        .where(where)
        .orderBy(desc(usageEvent.occurredAt), desc(usageEvent.id))
        .limit(page.limit)
        .offset(page.offset);
      const [count] = await tx
        .select({ totalCount: sql<number>`count(*)`.mapWith(Number) })
        .from(usageEvent)
        .where(where);
      return { rows, totalCount: count?.totalCount ?? 0 };
    });
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

  /** A company's rows of these meters in a half-open window — the index's own columns. */
  private inWindow(tenantId: string, meters: readonly LedgerMeter[], window: UsageWindow) {
    return and(
      eq(usageEvent.tenantId, tenantId),
      inArray(usageEvent.meter, [...meters]),
      gte(usageEvent.occurredAt, window.from),
      lt(usageEvent.occurredAt, window.to),
    );
  }
}
