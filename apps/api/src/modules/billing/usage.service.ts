import type {
  StorageGaugePageResult,
  UsageRecordStepInput,
  UsageRecordStepResult,
} from '@heliogrid/contracts/workflows';
import {
  type BilledLedgerMeter,
  type CostLine,
  isBilledMeter,
  type LedgerMeter,
  storageRefuses,
  usagePeriodKey,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { EntitlementBlockedException } from '../../common/errors/entitlement-blocked';
import { EntitlementService } from './entitlement.service';
import { UsageAdminRepository } from './usage.admin.repository';
import { type StorageGauge, UsageRepository, type UsageWindow } from './usage.repository';

/** Companies weighed per gauge step: one page stays well inside its step's timeout. */
const GAUGE_PAGE = 200;

/**
 * The usage ledger (`M12-32`): the outbox step's write, the one rollup behind two typed doors, the
 * nightly storage gauge and the storage gate it feeds. What a meter IS and when storage refuses
 * are domain's (`commerce/usage.ts`); this reads, writes and asks.
 */
@Injectable()
export class UsageService {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(UsageRepository) private readonly scoped: UsageRepository,
    @Inject(UsageAdminRepository) private readonly admin: UsageAdminRepository,
    @Inject(EntitlementService) private readonly entitlements: EntitlementService,
  ) {}

  /** The `usageRecord` step: writes the row once; a repeat of the same event writes nothing. */
  async record(event: UsageRecordStepInput, now: number): Promise<UsageRecordStepResult> {
    const recorded = await this.admin.record({
      ...event,
      // A cost line never bills, whatever an event claims; the table's CHECK holds the same.
      billable: event.billable && isBilledMeter(event.meter),
      periodKey: usagePeriodKey(event.occurredAt),
      occurredAt: new Date(event.occurredAt),
      recordedAt: new Date(now),
    });
    return { recorded };
  }

  /**
   * What a company used of each billed meter in a window, counting billable units only — the one
   * figure the usage screen, the gates and the invoice read (`M12-34`). A meter with no use is 0.
   */
  billedRollupOf(
    tenantId: string,
    meters: readonly BilledLedgerMeter[],
    window: UsageWindow,
  ): Promise<ReadonlyMap<BilledLedgerMeter, number>> {
    return this.sumsOf(tenantId, meters, window, 'billed');
  }

  /** What a company cost the platform on each cost line in a window — the quotas' read, never shown. */
  costRollupOf(
    tenantId: string,
    lines: readonly CostLine[],
    window: UsageWindow,
  ): Promise<ReadonlyMap<CostLine, number>> {
    return this.sumsOf(tenantId, lines, window, 'total');
  }

  /** The latest nightly weight of a company's files; `null` before its first night. */
  latestStorageGauge(tenantId: string): Promise<StorageGauge | null> {
    return this.scoped.latestGauge(tenantId);
  }

  /** One page of the nightly gauge, dated by the UTC night its run started in. */
  async weighStoragePage(
    after: string | null,
    runStartedAt: number,
  ): Promise<StorageGaugePageResult> {
    const ids = await this.admin.companyPage(after, GAUGE_PAGE);
    await this.weigh(ids, runStartedAt);
    return { weighed: ids.length, after: ids.length === GAUGE_PAGE ? (ids.at(-1) ?? null) : null };
  }

  /** Weighs the named companies for the UTC night `now` falls in. */
  weigh(ids: readonly string[], now: number): Promise<void> {
    const takenAt = new Date(now);
    return this.admin.weigh(ids, takenAt.toISOString().slice(0, 10), takenAt);
  }

  /**
   * The storage gate (`M12-23`, `BM-20`), at upload issuance only: refuses when the latest gauge
   * is past the ceiling plus a tenth. No gauge yet, no limit row, or a limit with no number
   * refuses nothing — a gate never invents a block (`M12-21`).
   */
  async refuseUploadOverStorage(tenantId: string): Promise<void> {
    const gauge = await this.scoped.latestGauge(tenantId);
    if (gauge === null) return;
    const limit = (await this.entitlements.limitsOf(tenantId))?.get('storage_gb')?.limit;
    if (limit === undefined || !storageRefuses(gauge.gaugeBytes, limit)) return;
    throw new EntitlementBlockedException({
      reason: 'cap',
      capability: 'new_file_upload',
      key: 'storage_gb',
      resetsAt: null,
    });
  }

  private async sumsOf<M extends LedgerMeter>(
    tenantId: string,
    meters: readonly M[],
    window: UsageWindow,
    count: 'billed' | 'total',
  ): Promise<ReadonlyMap<M, number>> {
    const rows = await this.scoped.sumsOf(tenantId, meters, window);
    const byMeter = new Map<LedgerMeter, number>(rows.map((row) => [row.meter, row[count]]));
    return new Map(meters.map((meter) => [meter, byMeter.get(meter) ?? 0]));
  }
}
