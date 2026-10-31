import { randomUUID } from 'node:crypto';
import type { GatewayCheckoutRequest, OpenedCheckout } from '@heliogrid/contracts';
import { billingCheckout, planPrice, subscription } from '@heliogrid/db';
import type { BillingCycle, Tier } from '@heliogrid/domain';
import {
  ENTITLEMENT_BUFFER_DAYS,
  IN_PACK,
  listedPrice,
  type MinorUnits,
  MS_PER_DAY,
  minorUnits,
} from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { eq } from 'drizzle-orm';
import type { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import { ReconcileAdminRepository } from '../../src/modules/billing/reconcile.admin.repository';
import { ReconcileService } from '../../src/modules/billing/reconcile.service';
import { RenewalAdminRepository } from '../../src/modules/billing/renewal.admin.repository';
import { RenewalService } from '../../src/modules/billing/renewal.service';
import { aCompany, type Company, type openPools, seed } from '../support/fixture';
import { marketsOf } from '../support/market';
import { invoicesOf } from './invoice-bench';
import { overageSweep } from './overage-bench';
import { aPlan, chargeServiceOf, collectedFor, silentLogger, usageServiceOf } from './support';

/**
 * What the renewal suite builds: a company converted onto a yearly plan by payment link, its first
 * year paid, and a gateway that remembers every link it opened.
 */

type Pools = ReturnType<typeof openPools>;

/** The development gateway, keeping each page it opened and the request that opened it. */
export class LinkRecordingGateway extends DevelopmentBillingGateway {
  readonly opened: { request: GatewayCheckoutRequest; page: OpenedCheckout }[] = [];

  constructor() {
    super(silentLogger());
  }

  override async openCheckout(request: GatewayCheckoutRequest): Promise<OpenedCheckout> {
    const page = await super.openCheckout(request);
    this.opened.push({ request, page });
    return page;
  }
}

/** A gateway that never opens a page: every renewal link it is asked for fails. */
export class RefusingLinkGateway extends LinkRecordingGateway {
  override async openCheckout(): Promise<OpenedCheckout> {
    throw new Error('the gateway refused the page');
  }
}

export interface YearlyCompany {
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly planPriceId: string;
  /** Where its first, paid year ends. */
  readonly yearEnds: number;
}

/**
 * A company converted at `convertedAt` onto `tier` by payment link, its first period paid through
 * the charge path — so its limits are the tier's and its paid period ends a cycle on. Yearly
 * unless told: a monthly row on a link is one the pack no longer sells by link.
 */
export async function aYearlyCompany(
  pools: Pools,
  companies: Company[],
  tier: Tier,
  convertedAt: number,
  cycle: BillingCycle = 'yearly',
): Promise<YearlyCompany> {
  const company = aCompany(`Renewal ${randomUUID()}`);
  companies.push(company);
  await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
  const plan = await aPlan(pools.admin.db, tier, cycle);
  const [held] = await pools.admin.db
    .insert(subscription)
    .values({
      tenantId: company.tenantId,
      state: 'active',
      stateEnteredAt: new Date(convertedAt),
      paidPeriodEnd: new Date(convertedAt),
      createdAt: new Date(convertedAt),
      ...plan,
    })
    .returning({ id: subscription.id });
  if (held === undefined) throw new Error('the subscription was not seeded');
  await pools.admin.db.insert(billingCheckout).values({
    tenantId: company.tenantId,
    subscriptionId: held.id,
    planPriceId: plan.planPriceId,
    collection: 'invoice',
    gatewayRef: plan.gatewayRef,
    hostedUrl: 'https://development-checkout.invalid/renewal',
    expiresAt: new Date(convertedAt),
    openedAt: new Date(convertedAt - 1),
    closedAt: new Date(convertedAt),
  });
  const yearEnds = cycleEnd(convertedAt, cycle);
  await chargeServiceOf(pools).recordSuccess(
    {
      subscriptionId: held.id,
      chargeRef: `pay_${randomUUID()}`,
      occurredAt: convertedAt,
      paysThrough: yearEnds,
      amount: collectedFor(tier, cycle),
      currencyCode: 'INR',
    },
    convertedAt,
  );
  return {
    tenantId: company.tenantId,
    subscriptionId: held.id,
    planPriceId: plan.planPriceId,
    yearEnds,
  };
}

/** The renewals as `billing.module.ts` composes them, on the gateway and alerts given. */
export function renewalServiceOf(
  pools: Pools,
  gateway: DevelopmentBillingGateway,
  alerts: BillingAlerts,
): RenewalService {
  return new RenewalService(
    new RenewalAdminRepository(pools.admin.db),
    marketsOf(pools),
    gateway,
    chargeServiceOf(pools, alerts),
    alerts,
    silentLogger(),
  );
}

/** The reconcile as `billing.module.ts` composes it. */
export function reconcileOf(
  pools: Pools,
  gateway: DevelopmentBillingGateway,
  alerts: BillingAlerts,
): ReconcileService {
  return new ReconcileService(
    new ReconcileAdminRepository(pools.admin.db),
    gateway,
    chargeServiceOf(pools, alerts),
    alerts,
    silentLogger(),
  );
}

/** The company's subscription row as the charge path and the timers leave it. */
export async function rowOf(pools: Pools, company: YearlyCompany) {
  const [row] = await pools.admin.db
    .select({
      state: subscription.state,
      stateEnteredAt: subscription.stateEnteredAt,
      paidPeriodEnd: subscription.paidPeriodEnd,
      planPriceId: subscription.planPriceId,
    })
    .from(subscription)
    .where(eq(subscription.id, company.subscriptionId));
  return row;
}

/**
 * One suite's year: a company converted on 12 March, its year's end, the sweep a day after it
 * settles, and the renewal's due moment. Each suite takes a year of its own, since the sweep and
 * the timers read every company and suites run side by side.
 */
export function renewalTimeline(year: number) {
  const convertedAt = Date.parse(`${year}-03-12T06:30:00Z`);
  const yearEnds = cycleEnd(convertedAt, 'yearly');
  return {
    convertedAt,
    yearEnds,
    nextYearEnds: cycleEnd(yearEnds, 'yearly'),
    sweptAt: yearEnds + 2 * MS_PER_DAY,
    dueAt: yearEnds + ENTITLEMENT_BUFFER_DAYS * MS_PER_DAY,
    midJune: Date.parse(`${year}-06-15T12:00:00Z`),
    midJuly: Date.parse(`${year}-07-15T12:00:00Z`),
  };
}

const detection = IN_PACK.priceBook.overage.ai_roof_detections;
if (detection.kind !== 'per_unit') throw new Error('the IN book bills detections per unit');
const bundle = IN_PACK.priceBook.tiers.starter?.capacity.meterBundles.ai_roof_detections;
if (typeof bundle !== 'number') throw new Error('Starter carries a detection bundle');
const starterYearly = listedPrice(IN_PACK.priceBook, 'starter', 'yearly');
if (starterYearly === null) throw new Error('the IN book sells Starter yearly');

/** Pro yearly, which no other suite seeds, so a reprice of it reaches only that suite's rows. */
const proYearly = listedPrice(IN_PACK.priceBook, 'pro', 'yearly');
if (proYearly === null) throw new Error('the IN book sells Pro yearly');
const REPRICE_RISE_MINOR = 2_500_000;

/** The book's figures the suites bill by: never typed, always read. */
export const fromTheBook = {
  detectionRate: detection.rate,
  starterDetectionBundle: bundle,
  starterYearly,
  proYearly,
  /** Pro yearly after a reprice the company did not sign up on. */
  repricedProYearly: minorUnits(proYearly + REPRICE_RISE_MINOR),
};

/**
 * A reprice of the company's plan: a newer row of the same market × tier × cycle × currency at
 * `listMinor`, as `pack:publish` writes one. Written after the company converted, so it is the
 * current row. Answers its id.
 */
export async function aReprice(
  pools: Pools,
  company: YearlyCompany,
  listMinor: MinorUnits,
): Promise<string> {
  const [held] = await pools.admin.db
    .select({
      marketCode: planPrice.marketCode,
      tier: planPrice.tier,
      cycle: planPrice.cycle,
      currencyCode: planPrice.currencyCode,
      createdAt: planPrice.createdAt,
    })
    .from(planPrice)
    .where(eq(planPrice.id, company.planPriceId));
  if (held === undefined) throw new Error('the company bills no plan price');
  const [row] = await pools.admin.db
    .insert(planPrice)
    .values({
      marketCode: held.marketCode,
      packVersion: `test-${randomUUID()}`,
      tier: held.tier,
      cycle: held.cycle,
      currencyCode: held.currencyCode,
      listMinor,
      collectedMinor: platformSaleTotal(IN_PACK, listMinor),
      gatewayPlanRef: `plan_${randomUUID()}`,
      createdAt: new Date(held.createdAt.getTime() + 1),
    })
    .returning({ id: planPrice.id });
  if (row === undefined) throw new Error('the reprice was not written');
  return row.id;
}

/** Billable detections of the company, ledgered at `at`. */
export async function detections(
  pools: Pools,
  company: YearlyCompany,
  quantity: number,
  at: number,
): Promise<void> {
  await usageServiceOf(pools).record(
    {
      tenantId: company.tenantId,
      meter: 'ai_roof_detections',
      quantity,
      billable: true,
      subjectKind: 'tenant',
      subjectRef: company.tenantId,
      idempotencyKey: randomUUID(),
      occurredAt: new Date(at).toISOString(),
    },
    at,
  );
}

/** The company's invoices for the period ending `paysThrough`: its renewal. */
export async function renewalOf(pools: Pools, company: YearlyCompany, paysThrough: number) {
  const invoices = await invoicesOf(pools.admin.db, company.subscriptionId);
  return invoices.filter((invoice) => invoice.paysThrough.getTime() === paysThrough);
}

/** The sweep's step as `billing.activities.ts` runs it: reckon, add, then raise. */
export async function sweep(
  pools: Pools,
  gateway: DevelopmentBillingGateway,
  alerts: BillingAlerts,
  now: number,
): Promise<number> {
  await overageSweep(pools, gateway, alerts).addDue(now);
  return renewalServiceOf(pools, gateway, alerts).raiseDue(now);
}

/** The first link's charge, as the gateway reports it: a payment link names no period end. */
export function linkCharge(gateway: LinkRecordingGateway, at: number, amount: MinorUnits) {
  const [link] = gateway.opened;
  if (link === undefined) throw new Error('no renewal link was opened');
  return {
    gatewayRef: link.page.gatewayRef,
    chargeRef: `pay_${randomUUID()}`,
    occurredAt: at,
    paysThrough: null,
    amount,
    currencyCode: 'INR',
  };
}
