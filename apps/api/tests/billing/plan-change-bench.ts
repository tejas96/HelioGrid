import type {
  BillingHome,
  PlanChangeOutcome,
  PlanChangePreview,
  PlanPick,
} from '@heliogrid/contracts';
import { entitlement, storageGaugeSnapshot, subscriptionPlanChange } from '@heliogrid/db';
import { BYTES_PER_GB, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { BillingHomeRepository } from '../../src/modules/billing/billing-home.repository';
import { PlanChangeAdminRepository } from '../../src/modules/billing/plan-change.admin.repository';
import { PlanChangeBoundaryAdminRepository } from '../../src/modules/billing/plan-change.boundary.admin.repository';
import { PlanChangeBoundaryService } from '../../src/modules/billing/plan-change.boundary.service';
import { PlanChangePreviewService } from '../../src/modules/billing/plan-change.preview.service';
import { PlanPriceAdminRepository } from '../../src/modules/billing/plan-price.admin.repository';
import type { openPools } from '../support/fixture';
import type { Reply } from '../support/http';
import { marketsOf } from '../support/market';
import type { ConversionHarness, TrialOwner } from './conversion-harness';
import { entitlementServiceOf, usageServiceOf } from './support';

type Pools = ReturnType<typeof openPools>;

/** The boundary of a scheduled plan change as `billing.module.ts` composes it. */
export function planChangeBoundaryOf(pools: Pools): PlanChangeBoundaryService {
  const prices = new PlanPriceAdminRepository(pools.admin.db);
  return new PlanChangeBoundaryService(
    new PlanChangeBoundaryAdminRepository(pools.admin.db),
    new PlanChangeAdminRepository(pools.admin.db),
    new PlanChangePreviewService(
      prices,
      marketsOf(pools),
      usageServiceOf(pools),
      new BillingHomeRepository(pools.tenants),
    ),
    prices,
    entitlementServiceOf(pools),
    marketsOf(pools),
  );
}

/** The plan screen's three acts and the rows they write, read over HTTP and the admin pool. */
export class PlanScreen {
  constructor(private readonly harness: ConversionHarness) {}

  async preview(owner: TrialOwner, pick: PlanPick): Promise<Reply<PlanChangePreview & ErrorBody>> {
    return this.harness.http.call(
      'GET',
      `/billing/plan-change/preview?tier=${pick.tier}&cycle=${pick.cycle}`,
      undefined,
      await owner.headers(),
    );
  }

  async change(
    owner: TrialOwner,
    body: PlanPick & { previewDigest: string },
  ): Promise<Reply<PlanChangeOutcome & ErrorBody>> {
    return this.harness.http.call('POST', '/billing/plan-change', body, await owner.headers());
  }

  /** The preview read, then confirmed on its own digest. */
  async confirm(owner: TrialOwner, pick: PlanPick): Promise<Reply<PlanChangeOutcome & ErrorBody>> {
    const preview = await this.preview(owner, pick);
    if (preview.status !== HttpStatus.OK)
      throw new Error(`preview: ${JSON.stringify(preview.body)}`);
    return this.change(owner, { ...pick, previewDigest: preview.body.digest });
  }

  async withdraw(owner: TrialOwner): Promise<Reply<{ withdrawn: boolean }>> {
    return this.harness.http.call(
      'POST',
      '/billing/plan-change/withdraw',
      {},
      await owner.headers(),
    );
  }

  async home(owner: TrialOwner): Promise<Reply<BillingHome>> {
    return this.harness.http.call('GET', '/billing/home', undefined, await owner.headers());
  }

  changesOf(subscriptionId: string) {
    return this.harness.pools.admin.db
      .select()
      .from(subscriptionPlanChange)
      .where(eq(subscriptionPlanChange.subscriptionId, subscriptionId))
      .orderBy(asc(subscriptionPlanChange.createdAt), asc(subscriptionPlanChange.id));
  }

  /** The company's stored limit for `key`: a count, or its kind when it has no number. */
  async limitOf(tenantId: string, key: string): Promise<number | string | undefined> {
    const [row] = await this.harness.pools.admin.db
      .select({ kind: entitlement.limitKind, value: entitlement.limitValue })
      .from(entitlement)
      .where(and(eq(entitlement.tenantId, tenantId), eq(entitlement.entitlementKey, key)));
    return row?.value ?? row?.kind;
  }

  /** A nightly storage weight of `gb` gigabytes for the company, taken on `night`. */
  async aGauge(tenantId: string, gb: number, night: string): Promise<number> {
    const gaugeBytes = Math.round(gb * BYTES_PER_GB);
    await this.harness.pools.admin.db
      .insert(storageGaugeSnapshot)
      .values({
        tenantId,
        snapshotDate: night,
        gaugeBytes,
        takenAt: new Date(`${night}T00:00:00Z`),
      })
      .onConflictDoUpdate({
        target: [storageGaugeSnapshot.tenantId, storageGaugeSnapshot.snapshotDate],
        set: { gaugeBytes },
      });
    return gaugeBytes;
  }
}

type ErrorBody = { error?: { code: string } };

/** A Growth monthly company with `daysLeft` whole days of its 30-day paid period left today. */
export function midCycle(harness: ConversionHarness, name: string, daysLeft = BOARD_DAYS_LEFT) {
  const paidAt = Date.now() - (PERIOD_DAYS - daysLeft) * MS_PER_DAY;
  return harness.aPaidOwner(name, { tier: 'growth', cycle: 'monthly', paidAt });
}

/** The board's sample: 16 of 30 days left (`T-M12-003` decision 3). */
const BOARD_DAYS_LEFT = 16;
const PERIOD_DAYS = 30;
