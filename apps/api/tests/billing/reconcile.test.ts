import { billingCheckout, planPrice, subscription } from '@heliogrid/db';
import { IN_PACK, MS_PER_DAY } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { ChargeService } from '../../src/modules/billing/charge.service';
import type { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { PlanPriceAdminRepository } from '../../src/modules/billing/plan-price.admin.repository';
import { PlanPriceService } from '../../src/modules/billing/plan-price.service';
import { ReconcileAdminRepository } from '../../src/modules/billing/reconcile.admin.repository';
import { ReconcileService } from '../../src/modules/billing/reconcile.service';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import {
  aDevelopmentGateway,
  aTrial,
  chargeServiceOf,
  collectedFor,
  RecordedAlerts,
  silentLogger,
} from './support';

/**
 * The 6-hour reconcile against a migrated database (`M12-09`, `M12-43`): a charge the gateway
 * collected but whose message never landed is recorded through the one charge path and alerted;
 * the next run finds nothing to do; money on a row no charge moves is alerted from either door.
 */

const skip = skipWithoutDatabase(
  'RECONCILE PROOF',
  'The reconcile’s repair and its alerts are UNPROVEN in this run.',
);

const NOW = Date.now();
const A_MINUTE_MS = 60_000;
const AN_HOUR_MS = 60 * A_MINUTE_MS;
const MONTH_DAYS = 30;
const TRIAL_DAYS_LEFT = 7;
const TRIAL_ENDS_AT = NOW + TRIAL_DAYS_LEFT * MS_PER_DAY;

describe.skipIf(skip)('the 6-hour reconcile (M12-09, M12-43)', () => {
  let pools: ReturnType<typeof openPools>;
  let gateway: DevelopmentBillingGateway;
  let alerts: RecordedAlerts;
  let charges: ChargeService;
  let reconcile: ReconcileService;
  const companies: Company[] = [];

  /** A trial with an open checkout for Growth monthly on `gatewayRef`. */
  async function aCheckout(gatewayRef: string, trialEndsAt = TRIAL_ENDS_AT) {
    const company = aCompany(`Reconcile ${gatewayRef}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    const subscriptionId = await aTrial(pools.admin.db, company.tenantId, trialEndsAt);
    const [price] = await pools.admin.db
      .select({ id: planPrice.id })
      .from(planPrice)
      .where(and(eq(planPrice.tier, 'growth'), eq(planPrice.cycle, 'monthly')))
      .limit(1);
    if (price === undefined) throw new Error('no plan price was published');
    await pools.admin.db.insert(billingCheckout).values({
      tenantId: company.tenantId,
      subscriptionId,
      planPriceId: price.id,
      collection: 'mandate',
      gatewayRef,
      hostedUrl: `https://development-checkout.invalid/${gatewayRef}`,
      expiresAt: new Date(trialEndsAt),
      openedAt: new Date(NOW - MS_PER_DAY),
    });
    return subscriptionId;
  }

  const aCharge = (gatewayRef: string, occurredAt: number) => ({
    gatewayRef,
    chargeRef: `pay_${gatewayRef}_${occurredAt}`,
    occurredAt,
    paysThrough: occurredAt + MONTH_DAYS * MS_PER_DAY,
    amount: collectedFor('growth', 'monthly'),
    currencyCode: 'INR',
  });

  /** Every page, as the workflow runs them. */
  async function runAll(): Promise<{ repaired: number }> {
    let repaired = 0;
    let after: string | null = null;
    do {
      const page = await reconcile.reconcilePage(after, NOW);
      repaired += page.repaired;
      after = page.after;
    } while (after !== null);
    return { repaired };
  }

  const stateOf = async (subscriptionId: string) =>
    (
      await pools.admin.db.select().from(subscription).where(eq(subscription.id, subscriptionId))
    )[0];

  beforeAll(async () => {
    pools = openPools();
    const logger = silentLogger();
    gateway = aDevelopmentGateway();
    alerts = new RecordedAlerts(logger);
    charges = chargeServiceOf(pools.admin.db, alerts);
    reconcile = new ReconcileService(
      new ReconcileAdminRepository(pools.admin.db),
      gateway,
      charges,
      alerts,
      logger,
    );
    await new PlanPriceService(new PlanPriceAdminRepository(pools.admin.db), gateway).sync(
      IN_PACK,
      NOW,
    );
  });

  beforeEach(() => {
    alerts.raised.length = 0;
  });

  afterAll(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    await pools.close();
  });

  it('a charge the webhook never told is recorded by the reconcile through the charge path and raises one repair alert', async () => {
    const gatewayRef = `sub_lost_${NOW}`;
    const subscriptionId = await aCheckout(gatewayRef);
    const charge = aCharge(gatewayRef, NOW - A_MINUTE_MS);
    gateway.collect(charge);

    expect((await runAll()).repaired).toBe(1);
    expect(await stateOf(subscriptionId)).toMatchObject({
      state: 'active',
      tier: 'growth',
      gatewayRef,
    });
    expect(alerts.raised.filter(([alert]) => alert === 'billing_repair')).toEqual([
      ['billing_repair', { gatewayRef, chargeRef: charge.chargeRef }],
    ]);

    alerts.raised.length = 0;
    expect((await runAll()).repaired).toBe(0);
    expect(alerts.raised).toEqual([]);
  });

  it('a charge on a dead row raises a dead-charge alert from the webhook and from the reconcile', async () => {
    // The trial expired an hour ago and its page was paid after: a row no charge moves.
    const expiredAt = NOW - AN_HOUR_MS;
    const told = `sub_dead_told_${NOW}`;
    const polled = `sub_dead_polled_${NOW}`;
    for (const gatewayRef of [told, polled]) {
      const subscriptionId = await aCheckout(gatewayRef, expiredAt);
      await pools.admin.db
        .update(subscription)
        .set({ state: 'expired', stateEnteredAt: new Date(expiredAt) })
        .where(eq(subscription.id, subscriptionId));
    }

    expect(await charges.recordCollected(aCharge(told, NOW - A_MINUTE_MS), NOW)).toBe('dead');
    expect(alerts.raised.map(([alert]) => alert)).toEqual(['billing_dead_charge']);

    alerts.raised.length = 0;
    gateway.collect(aCharge(polled, NOW - A_MINUTE_MS));
    await runAll();
    expect(alerts.raised.map(([alert]) => alert)).toEqual(['billing_dead_charge']);
  });
});
