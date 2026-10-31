import { auditLogEntry, billingCheckout, planPrice, subscription } from '@heliogrid/db';
import { bookEntitlements, IN_PACK, MS_PER_DAY, TRIAL_DAYS } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { BillingAdminRepository } from '../../src/modules/billing/billing.admin.repository';
import type { ChargeService } from '../../src/modules/billing/charge.service';
import type { EntitlementService } from '../../src/modules/billing/entitlement.service';
import type { StaffAct } from '../../src/modules/billing/entitlement-override.admin.repository';
import { PlanPriceAdminRepository } from '../../src/modules/billing/plan-price.admin.repository';
import { PlanPriceService } from '../../src/modules/billing/plan-price.service';
import {
  aCompany,
  aPerson,
  type Company,
  openPools,
  type Person,
  seed,
  unseed,
} from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import {
  aDevelopmentGateway,
  chargeServiceOf,
  collectedFor,
  entitlementServiceOf,
} from './support';

const MONTH_DAYS = 30;
const TRIAL_DAYS_LEFT = 7;

/**
 * What a support-override suite drives: the real services over both pools, the plan prices
 * published, one staff account, and the companies it makes — every one removed at `close`.
 */
export class OverrideBench {
  readonly now = Date.now();
  readonly trialEndsAt = this.now + TRIAL_DAYS_LEFT * MS_PER_DAY;
  readonly staff = aPerson('Support Staff');
  readonly companies: Company[] = [];
  readonly people: Person[] = [];
  readonly billing: BillingAdminRepository;

  private constructor(
    readonly pools: ReturnType<typeof openPools>,
    readonly entitlements: EntitlementService,
    readonly charges: ChargeService,
  ) {
    this.billing = new BillingAdminRepository(pools.admin.db);
  }

  static async open(): Promise<OverrideBench> {
    const pools = openPools();
    await publishIndiaPack(pools);
    const bench = new OverrideBench(pools, entitlementServiceOf(pools), chargeServiceOf(pools));
    await seed(pools.admin.db, { companies: [], people: [bench.staff], memberships: [] });
    await new PlanPriceService(
      new PlanPriceAdminRepository(pools.admin.db),
      aDevelopmentGateway(),
    ).sync(IN_PACK, bench.now);
    return bench;
  }

  async close(): Promise<void> {
    await unseed(this.pools.admin.db, {
      companies: this.companies,
      people: [this.staff, ...this.people],
      memberships: [],
    });
    await this.pools.close();
  }

  /** A company on its trial, ending at `trialEndsAt`, its limits written by the trial's start. */
  async aTrialCompany(
    name: string,
    trialEndsAt = this.trialEndsAt,
  ): Promise<{ company: Company; subscriptionId: string }> {
    const company = aCompany(`Overrides ${name} ${this.now}`);
    this.companies.push(company);
    await seed(this.pools.admin.db, { companies: [company], people: [], memberships: [] });
    await this.billing.startTrialFor(
      company.tenantId,
      trialEndsAt - TRIAL_DAYS * MS_PER_DAY,
      bookEntitlements(IN_PACK.priceBook, null),
    );
    const [row] = await this.pools.admin.db
      .select({ id: subscription.id })
      .from(subscription)
      .where(eq(subscription.tenantId, company.tenantId));
    if (row === undefined) throw new Error('the trial was not started');
    return { company, subscriptionId: row.id };
  }

  /** Support's act on a company, by the bench's staff account unless another is named. */
  actOn(tenantId: string, now = this.now): StaffAct {
    return {
      tenantId,
      staffUserId: this.staff.userId,
      reason: 'A missed call cost the company a week of its trial',
      now,
    };
  }

  async auditOf(tenantId: string) {
    return this.pools.admin.db
      .select({
        eventType: auditLogEntry.eventType,
        actorKind: auditLogEntry.actorKind,
        actorRef: auditLogEntry.actorRef,
        subjectKind: auditLogEntry.subjectKind,
        subjectRef: auditLogEntry.subjectRef,
      })
      .from(auditLogEntry)
      .where(eq(auditLogEntry.tenantId, tenantId));
  }

  /** Converts the trial to Growth monthly through a paid checkout, then renews it once. */
  async convertAndRenew(tenantId: string, subscriptionId: string): Promise<void> {
    const [price] = await this.pools.admin.db
      .select({ id: planPrice.id })
      .from(planPrice)
      .where(and(eq(planPrice.tier, 'growth'), eq(planPrice.cycle, 'monthly')))
      .limit(1);
    if (price === undefined) throw new Error('no plan price was published');
    const ref = `sub_override_${tenantId}`;
    await this.pools.admin.db.insert(billingCheckout).values({
      tenantId,
      subscriptionId,
      planPriceId: price.id,
      collection: 'mandate',
      gatewayRef: ref,
      hostedUrl: `https://development-checkout.invalid/${ref}`,
      expiresAt: new Date(this.trialEndsAt),
      openedAt: new Date(this.now - MS_PER_DAY),
    });
    for (const [n, occurredAt] of [this.now, this.now + MONTH_DAYS * MS_PER_DAY].entries()) {
      const recorded = await this.charges.recordCollected(
        {
          gatewayRef: ref,
          chargeRef: `pay_${n}_${ref}`,
          occurredAt,
          paysThrough: occurredAt + MONTH_DAYS * MS_PER_DAY,
          amount: collectedFor('growth', 'monthly'),
          currencyCode: 'INR',
        },
        this.now + n + 1,
      );
      if (recorded !== 'recorded') throw new Error(`a charge was ${recorded}, not recorded`);
    }
  }
}
