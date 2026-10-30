import { randomUUID } from 'node:crypto';
import type { BillingGateway } from '@heliogrid/contracts';
import { billingCheckout, overageAddOn, subscription } from '@heliogrid/db';
import {
  type BilledLedgerMeter,
  type ChargeSucceeded,
  type MinorUnits,
  MS_PER_DAY,
  OVERAGE_SETTLE_DAYS,
  type Tier,
} from '@heliogrid/domain';
import { asc, eq } from 'drizzle-orm';
import type { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { OverageAdminRepository } from '../../src/modules/billing/overage.admin.repository';
import { OverageService } from '../../src/modules/billing/overage.service';
import { aCompany, type Company, type openPools, seed } from '../support/fixture';
import { marketsOf } from '../support/market';
import {
  aPlan,
  chargeServiceOf,
  collectedFor,
  entitlementServiceOf,
  silentLogger,
  usageServiceOf,
} from './support';

/**
 * What the overage suite builds and reads back: a monthly mandate with its May and June debits
 * recorded, its use, its debits and its add-on rows, in a year no other suite charges in.
 */

type Pools = ReturnType<typeof openPools>;

/**
 * May to August of one year: three paid periods of one monthly mandate. Each suite takes a year of
 * its own, since the sweep reads every company and suites run side by side.
 */
export function timeline(year: number) {
  const at = (monthDay: string) => Date.parse(`${year}-${monthDay}Z`);
  const JUNE = at('06-01T00:00:00');
  return {
    MAY: at('05-01T00:00:00'),
    JUNE,
    JULY: at('07-01T00:00:00'),
    AUGUST: at('08-01T00:00:00'),
    MID_MAY: at('05-15T12:00:00'),
    MID_JUNE: at('06-15T12:00:00'),
    /** The sweep runs a day after May has closed and settled. */
    MAY_SETTLED: JUNE + (OVERAGE_SETTLE_DAYS + 1) * MS_PER_DAY,
  };
}

export type Timeline = ReturnType<typeof timeline>;

export interface Mandate {
  readonly tenantId: string;
  readonly subscriptionId: string;
  readonly gatewayRef: string;
  /** What the gateway collects for the plan on each debit. */
  readonly planAmount: MinorUnits;
}

/**
 * A company on `tier` monthly by mandate, its May and June debits recorded — so its limits are the
 * tier's and its next debit is 1 July. The company joins `companies`, for the suite to unseed.
 */
export async function aMandate(
  pools: Pools,
  companies: Company[],
  tier: Tier,
  { MAY, JUNE, JULY }: Timeline,
): Promise<Mandate> {
  const company = aCompany(`Overage ${randomUUID()}`);
  companies.push(company);
  await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
  const plan = await aPlan(pools.admin.db, tier, 'monthly');
  const [held] = await pools.admin.db
    .insert(subscription)
    .values({
      tenantId: company.tenantId,
      state: 'active',
      stateEnteredAt: new Date(MAY),
      paidPeriodEnd: new Date(MAY),
      createdAt: new Date(MAY),
      ...plan,
    })
    .returning({ id: subscription.id });
  if (held === undefined) throw new Error('the subscription was not seeded');
  await pools.admin.db.insert(billingCheckout).values({
    tenantId: company.tenantId,
    subscriptionId: held.id,
    planPriceId: plan.planPriceId,
    collection: 'mandate',
    gatewayRef: plan.gatewayRef,
    hostedUrl: 'https://development-checkout.invalid/overage',
    expiresAt: new Date(MAY),
    openedAt: new Date(MAY - MS_PER_DAY),
    closedAt: new Date(MAY),
  });
  const mandate: Mandate = {
    tenantId: company.tenantId,
    subscriptionId: held.id,
    gatewayRef: plan.gatewayRef,
    planAmount: collectedFor(tier, 'monthly'),
  };
  await debit(pools, mandate, MAY, JUNE);
  await debit(pools, mandate, JUNE, JULY);
  return mandate;
}

/** One debit of the mandate at `at`, paying through `through`: the plan's amount unless told. */
export function aDebit(
  mandate: Mandate,
  at: number,
  through: number,
  amount: MinorUnits = mandate.planAmount,
): ChargeSucceeded {
  return {
    subscriptionId: mandate.subscriptionId,
    chargeRef: `pay_${randomUUID()}`,
    occurredAt: at,
    paysThrough: through,
    amount,
    currencyCode: 'INR',
  };
}

/** A debit through the charge path, recorded the moment it lands. */
export function debit(
  pools: Pools,
  mandate: Mandate,
  at: number,
  through: number,
  amount?: MinorUnits,
): Promise<'recorded' | 'duplicate' | 'dead'> {
  return chargeServiceOf(pools).recordSuccess(aDebit(mandate, at, through, amount), at);
}

/** Billable use of one meter, ledgered at `at`. */
export async function use(
  pools: Pools,
  mandate: Mandate,
  meter: BilledLedgerMeter,
  quantity: number,
  at: number,
): Promise<void> {
  await usageServiceOf(pools).record(
    {
      tenantId: mandate.tenantId,
      meter,
      quantity,
      billable: true,
      subjectKind: 'tenant',
      subjectRef: mandate.tenantId,
      idempotencyKey: randomUUID(),
      occurredAt: new Date(at).toISOString(),
    },
    at,
  );
}

/** A mandate's add-on rows, by period and then in the ledger's meter order. */
export function addOnsOf(pools: Pools, mandate: Mandate) {
  return pools.admin.db
    .select({
      meter: overageAddOn.meter,
      windowFrom: overageAddOn.windowFrom,
      windowTo: overageAddOn.windowTo,
      used: overageAddOn.used,
      allowance: overageAddOn.allowance,
      quantity: overageAddOn.quantity,
      unitRateMinor: overageAddOn.unitRateMinor,
      amountMinor: overageAddOn.amountMinor,
      status: overageAddOn.status,
      gatewayRef: overageAddOn.gatewayRef,
      invoiceId: overageAddOn.invoiceId,
    })
    .from(overageAddOn)
    .where(eq(overageAddOn.subscriptionId, mandate.subscriptionId))
    .orderBy(asc(overageAddOn.windowFrom), asc(overageAddOn.meter));
}

/** The overage sweep as `billing.module.ts` composes it, on the gateway and alerts given. */
export function overageSweep(
  pools: Pools,
  gateway: BillingGateway,
  alerts: BillingAlerts,
): OverageService {
  return new OverageService(
    new OverageAdminRepository(pools.admin.db),
    usageServiceOf(pools),
    entitlementServiceOf(pools),
    marketsOf(pools),
    gateway,
    alerts,
    silentLogger(),
  );
}
