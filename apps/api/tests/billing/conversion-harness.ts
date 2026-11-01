import { BILLING_GATEWAY } from '@heliogrid/contracts';
import {
  auditLogEntry,
  billingCheckout,
  subscription,
  subscriptionInvoice,
  subscriptionPayment,
  subscriptionStateHistory,
} from '@heliogrid/db';
import {
  type BillingCycle,
  can,
  FOUNDER_ROLE,
  type MinorUnits,
  MS_PER_DAY,
  ROLE_PRESETS,
  type RolePreset,
  type Tier,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { PlanPriceService } from '../../src/modules/billing/billing.public';
import type { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { MarketPackService } from '../../src/modules/market/market.public';
import { aDevice } from '../support/devices';
import {
  aCompany,
  aMembership,
  aPerson,
  type Company,
  type Fixture,
  openPools,
  seed,
  unseed,
} from '../support/fixture';
import { bearerFor, bootHttp, type Http, type Reply } from '../support/http';
import { aTrial, collectedFor, signed } from './support';

const TRIAL_DAYS_LEFT = 7;
const MONTH_DAYS = 30;

/** The charge ref `tellPaid` gives a charge on `gatewayRef` at `occurredAt`. */
export const chargeRefOf = (gatewayRef: string, occurredAt: number): string =>
  `pay_${gatewayRef}_${occurredAt}`;

/** A company of its own, its owner signed in, holding a trial. */
/** A preset that holds no billing capability: what a member who is not the Owner sees (`M12-56`). */
export const NOT_BILLING: RolePreset = (() => {
  const preset = ROLE_PRESETS.find((each) => !can([each], 'billing.view_usage_and_invoices'));
  if (preset === undefined) throw new Error('every preset sees billing');
  return preset;
})();

export interface TrialOwner {
  readonly company: Company;
  readonly subscriptionId: string;
  readonly headers: () => Promise<Record<string, string>>;
  /** The Owner's own user id: the actor an Owner's act is audited by. */
  readonly ownerUserId: string;
}

/** A company that paid its first cycle on a hosted page: the charge, its period and its mandate. */
export interface PaidOwner extends TrialOwner {
  readonly gatewayRef: string;
  readonly chargeRef: string;
  readonly paidAt: number;
  readonly paidPeriodEnd: number;
  readonly amount: MinorUnits;
}

/**
 * The api as it boots, the plan prices published, and the reads a conversion suite asserts on.
 * Each owner it makes is its own company, removed at `close`.
 */
export class ConversionHarness {
  readonly trialEndsAt = Date.now() + TRIAL_DAYS_LEFT * MS_PER_DAY;
  private readonly seeded: Fixture[] = [];

  private constructor(
    readonly pools: ReturnType<typeof openPools>,
    readonly http: Http,
  ) {}

  static async open(): Promise<ConversionHarness> {
    const pools = openPools();
    const http = await bootHttp();
    const pack = await http.app.get(MarketPackService).currentPackOf('IN');
    await http.app.get(PlanPriceService).sync(pack, Date.now());
    return new ConversionHarness(pools, http);
  }

  async close(): Promise<void> {
    await this.http.close();
    for (const mine of this.seeded) await unseed(this.pools.admin.db, mine);
    await this.pools.close();
  }

  /** The development gateway the api bound, to collect a charge whose message never lands. */
  get gateway(): DevelopmentBillingGateway {
    return this.http.app.get(BILLING_GATEWAY) as DevelopmentBillingGateway;
  }

  async anOwnerOnATrial(name: string): Promise<TrialOwner> {
    const company = aCompany(name);
    const person = aPerson(`${name} Owner`);
    const membership = aMembership(company, person, [FOUNDER_ROLE]);
    const device = aDevice(person, company);
    const mine: Fixture = {
      companies: [company],
      people: [person],
      memberships: [membership],
      devices: [device],
    };
    await seed(this.pools.admin.db, mine);
    this.seeded.push(mine);
    const subscriptionId = await aTrial(this.pools.admin.db, company.tenantId, this.trialEndsAt);
    return {
      company,
      subscriptionId,
      ownerUserId: person.userId,
      headers: () => bearerFor(this.http, membership, device),
    };
  }

  /** Another person in the owner's company, holding `role`, with their own signed-in headers. */
  async aMemberOf(
    owner: TrialOwner,
    role: RolePreset,
  ): Promise<() => Promise<Record<string, string>>> {
    const person = aPerson(`${owner.company.companyName} ${role}`);
    const membership = aMembership(owner.company, person, [role]);
    const device = aDevice(person, owner.company);
    const mine: Fixture = {
      companies: [],
      people: [person],
      memberships: [membership],
      devices: [device],
    };
    await seed(this.pools.admin.db, mine);
    // After the company's own fixture: its teardown removes the membership before the person.
    this.seeded.push(mine);
    return () => bearerFor(this.http, membership, device);
  }

  /**
   * A company converted by paying `tier` on `cycle` at `paidAt`, through its own hosted page and the
   * gateway's signed message. The trial is dated to begin before the charge, so the charge is news.
   */
  async aPaidOwner(
    name: string,
    plan: { tier: Tier; cycle: BillingCycle; paidAt: number; periodDays?: number },
  ): Promise<PaidOwner> {
    const owner = await this.anOwnerOnATrial(name);
    await this.pools.admin.db
      .update(subscription)
      .set({ stateEnteredAt: new Date(plan.paidAt - MS_PER_DAY) })
      .where(eq(subscription.id, owner.subscriptionId));
    const opened = await this.checkout(owner, { tier: plan.tier, cycle: plan.cycle });
    if (opened.status !== HttpStatus.OK)
      throw new Error(`checkout: ${JSON.stringify(opened.body)}`);
    const { gatewayRef } = await this.openCheckoutOf(owner.subscriptionId);
    const paidPeriodEnd = plan.paidAt + (plan.periodDays ?? MONTH_DAYS) * MS_PER_DAY;
    const amount = collectedFor(plan.tier, plan.cycle);
    const told = await this.tellPaid(gatewayRef, plan.paidAt, paidPeriodEnd, amount);
    if (told.status !== HttpStatus.OK) throw new Error(`charged: ${JSON.stringify(told.body)}`);
    const row = await this.subscriptionOf(owner.subscriptionId);
    if (row?.state !== 'active') throw new Error(`the paid company is ${row?.state}, not active`);
    return {
      ...owner,
      gatewayRef,
      chargeRef: chargeRefOf(gatewayRef, plan.paidAt),
      paidAt: plan.paidAt,
      paidPeriodEnd,
      amount,
    };
  }

  /** Every subscription of the company, oldest first. */
  subscriptionsOf(tenantId: string) {
    return this.pools.admin.db
      .select()
      .from(subscription)
      .where(eq(subscription.tenantId, tenantId))
      .orderBy(asc(subscription.createdAt), asc(subscription.id));
  }

  historyOf(tenantId: string) {
    return this.pools.admin.db
      .select()
      .from(subscriptionStateHistory)
      .where(eq(subscriptionStateHistory.tenantId, tenantId))
      .orderBy(asc(subscriptionStateHistory.id));
  }

  invoicesOf(tenantId: string) {
    return this.pools.admin.db
      .select()
      .from(subscriptionInvoice)
      .where(eq(subscriptionInvoice.tenantId, tenantId))
      .orderBy(asc(subscriptionInvoice.issuedAt), asc(subscriptionInvoice.id));
  }

  paymentsOf(tenantId: string) {
    return this.pools.admin.db
      .select()
      .from(subscriptionPayment)
      .where(eq(subscriptionPayment.tenantId, tenantId))
      .orderBy(asc(subscriptionPayment.occurredAt), asc(subscriptionPayment.id));
  }

  auditOf(tenantId: string) {
    return this.pools.admin.db
      .select()
      .from(auditLogEntry)
      .where(eq(auditLogEntry.tenantId, tenantId))
      .orderBy(asc(auditLogEntry.occurredAt));
  }

  async checkout(
    owner: TrialOwner,
    body: unknown,
  ): Promise<Reply<{ checkoutUrl?: string; error?: { code: string } }>> {
    return this.http.call('POST', '/billing/checkout', body, await owner.headers());
  }

  async checkoutsOf(subscriptionId: string) {
    const rows = await this.pools.admin.db
      .select()
      .from(billingCheckout)
      .where(eq(billingCheckout.subscriptionId, subscriptionId));
    return { open: rows.filter((row) => row.closedAt === null), all: rows };
  }

  /** The one open checkout; a suite that expects one and finds none fails here. */
  async openCheckoutOf(subscriptionId: string) {
    const [open] = (await this.checkoutsOf(subscriptionId)).open;
    if (open === undefined) throw new Error('no checkout is open');
    return open;
  }

  async subscriptionOf(subscriptionId: string) {
    const [row] = await this.pools.admin.db
      .select()
      .from(subscription)
      .where(eq(subscription.id, subscriptionId));
    return row;
  }

  /** The gateway's message that a page was paid, sent to the api. */
  async tellPaid(
    gatewayRef: string,
    occurredAt: number,
    paysThrough: number | null,
    amount: MinorUnits,
  ): Promise<Reply> {
    const message = signed({
      eventRef: `evt_${gatewayRef}_${occurredAt}`,
      kind: 'charged',
      charge: {
        gatewayRef,
        chargeRef: chargeRefOf(gatewayRef, occurredAt),
        occurredAt,
        paysThrough,
        amount,
        currencyCode: 'INR',
      },
    });
    return this.http.callAnonymously(
      'POST',
      '/billing/gateway-events',
      message.body,
      message.headers,
    );
  }
}
