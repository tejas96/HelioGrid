import { randomUUID } from 'node:crypto';
import { storageGaugeSnapshot } from '@heliogrid/db';
import { BYTES_PER_GB, type Tier } from '@heliogrid/domain';
import { recomputeEntitlements } from '../../src/modules/billing/entitlement.admin.repository';
import { EntitlementService } from '../../src/modules/billing/entitlement.service';
import { UsageService } from '../../src/modules/billing/usage.service';
import type { HomeBench, HomeCompany } from './home-bench';

/**
 * What the usage screen's suites put in a company beside the home bench's rows: the limits the
 * book gives its tier (or the trial), voice minutes in the ledger, and a nightly storage reading.
 */
export class UsageBench {
  constructor(private readonly bench: HomeBench) {}

  get usage(): UsageService {
    return this.bench.http.app.get(UsageService);
  }

  get entitlements(): EntitlementService {
    return this.bench.http.app.get(EntitlementService);
  }

  /** The book's limits for `tier` — the trial's for `null` — written as the plan moves write them. */
  async limits(held: HomeCompany, tier: Tier | null): Promise<void> {
    const limitsFor = await this.entitlements.limitsIn('IN');
    await this.bench.pools.admin.db.transaction((tx) =>
      recomputeEntitlements(tx, {
        tenantId: held.tenantId,
        subscriptionId: held.subscriptionId,
        base: limitsFor(tier),
        now: Date.now(),
      }),
    );
  }

  /** One call of `seconds`, ledgered at `at`; billable unless the case says it is not. */
  async call(held: HomeCompany, seconds: number, at: number, billable = true): Promise<void> {
    await this.usage.record(
      {
        tenantId: held.tenantId,
        meter: 'voice_minutes',
        quantity: seconds,
        billable,
        subjectKind: 'tenant',
        subjectRef: held.tenantId,
        idempotencyKey: randomUUID(),
        occurredAt: new Date(at).toISOString(),
      },
      at,
    );
  }

  /** A sign-in code the ledger holds for `userId`, at `at`. */
  async code(held: HomeCompany, userId: string, at: number): Promise<void> {
    await this.usage.record(
      {
        tenantId: held.tenantId,
        meter: 'otp_delivery',
        quantity: 1,
        billable: false,
        subjectKind: 'user_account',
        subjectRef: userId,
        idempotencyKey: randomUUID(),
        occurredAt: new Date(at).toISOString(),
      },
      at,
    );
  }

  /** Last night's weight of the company's files, in GB. */
  async gauge(held: HomeCompany, gb: number, takenAt: number): Promise<void> {
    await this.bench.pools.admin.db.insert(storageGaugeSnapshot).values({
      tenantId: held.tenantId,
      snapshotDate: new Date(takenAt).toISOString().slice(0, 10),
      gaugeBytes: Math.round(gb * BYTES_PER_GB),
      takenAt: new Date(takenAt),
    });
  }
}
