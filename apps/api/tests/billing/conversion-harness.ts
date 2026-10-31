import { BILLING_GATEWAY } from '@heliogrid/contracts';
import { billingCheckout, subscription } from '@heliogrid/db';
import { FOUNDER_ROLE, type MinorUnits, MS_PER_DAY } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
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
import { aTrial, signed } from './support';

const TRIAL_DAYS_LEFT = 7;

/** A company of its own, its owner signed in, holding a trial. */
export interface TrialOwner {
  readonly company: Company;
  readonly subscriptionId: string;
  readonly headers: () => Promise<Record<string, string>>;
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
    return { company, subscriptionId, headers: () => bearerFor(this.http, membership, device) };
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
        chargeRef: `pay_${gatewayRef}_${occurredAt}`,
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
