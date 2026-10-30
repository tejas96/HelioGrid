import {
  billingCheckout,
  entitlement,
  planPrice,
  subscription,
  subscriptionPayment,
} from '@heliogrid/db';
import {
  bookEntitlements,
  type Entitlement,
  IN_PACK,
  MS_PER_DAY,
  successEffect,
  type Tier,
} from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BillingAdminRepository } from '../../src/modules/billing/billing.admin.repository';
import { ChargeAdminRepository } from '../../src/modules/billing/charge.admin.repository';
import type { ChargeService } from '../../src/modules/billing/charge.service';
import type { EntitlementService } from '../../src/modules/billing/entitlement.service';
import { PlanPriceAdminRepository } from '../../src/modules/billing/plan-price.admin.repository';
import { PlanPriceService } from '../../src/modules/billing/plan-price.service';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import {
  aDevelopmentGateway,
  aTrial,
  chargeServiceOf,
  collectedFor,
  entitlementServiceOf,
} from './support';

/**
 * Entitlements against a migrated database (`M12-16`): a company's limits are written by the act
 * that changes them, in that act's transaction, and every read after it sees them.
 */

const skip = skipWithoutDatabase(
  'ENTITLEMENT PROOF',
  'The limits a trial, a charge and the repair write are UNPROVEN in this run.',
);

const NOW = Date.now();
const MONTH_DAYS = 30;
const TRIAL_DAYS_LEFT = 7;
/** The moments each act lands at, a millisecond apart, so each recompute is told from the last. */
const STEPS = ['converted', 'renewed', 'retold', 'repaired'] as const;
const at = (step: (typeof STEPS)[number]): number => NOW + STEPS.indexOf(step) + 1;
const CONVERTED_AT = at('converted');
const RENEWED_AT = at('renewed');
const RETOLD_AT = at('retold');
const REPAIRED_AT = at('repaired');
const TRIAL_ENDS_AT = NOW + TRIAL_DAYS_LEFT * MS_PER_DAY;

/** The limits as the hot read hands them out, in key order. */
function asRead(limits: readonly Entitlement[]) {
  return new Map(limits.map((one) => [one.key, one]));
}

describe.skipIf(skip)('entitlements are recomputed in the act that changes them (M12-16)', () => {
  let pools: ReturnType<typeof openPools>;
  let entitlements: EntitlementService;
  let charges: ChargeService;
  const companies: Company[] = [];

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    entitlements = entitlementServiceOf(pools);
    charges = chargeServiceOf(pools);
    await new PlanPriceService(
      new PlanPriceAdminRepository(pools.admin.db),
      aDevelopmentGateway(),
    ).sync(IN_PACK, NOW);
  });

  afterAll(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    await pools.close();
  });

  async function aNewCompany(name: string): Promise<string> {
    const company = aCompany(`Entitlements ${name} ${NOW}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    return company.tenantId;
  }

  /** A company on its trial, its limits written by the trial's own start. */
  async function aTrialCompany(
    name: string,
  ): Promise<{ tenantId: string; subscriptionId: string }> {
    const tenantId = await aNewCompany(name);
    const started = await new BillingAdminRepository(pools.admin.db).startTrialFor(
      tenantId,
      NOW,
      bookEntitlements(IN_PACK.priceBook, null),
    );
    expect(started).toBe(true);
    const [row] = await pools.admin.db
      .select({ id: subscription.id })
      .from(subscription)
      .where(eq(subscription.tenantId, tenantId));
    if (row === undefined) throw new Error('the trial was not started');
    return { tenantId, subscriptionId: row.id };
  }

  /** An open checkout for `tier` monthly on the company's trial. */
  async function aCheckout(tenantId: string, subscriptionId: string, tier: Tier, ref: string) {
    const [price] = await pools.admin.db
      .select({ id: planPrice.id })
      .from(planPrice)
      .where(and(eq(planPrice.tier, tier), eq(planPrice.cycle, 'monthly')))
      .limit(1);
    if (price === undefined) throw new Error(`no ${tier} plan price was published`);
    await pools.admin.db.insert(billingCheckout).values({
      tenantId,
      subscriptionId,
      planPriceId: price.id,
      collection: 'mandate',
      gatewayRef: ref,
      hostedUrl: `https://development-checkout.invalid/${ref}`,
      expiresAt: new Date(TRIAL_ENDS_AT),
      openedAt: new Date(NOW - MS_PER_DAY),
    });
  }

  const aCharge = (gatewayRef: string, chargeRef: string, occurredAt: number) => ({
    gatewayRef,
    chargeRef,
    occurredAt,
    paysThrough: occurredAt + MONTH_DAYS * MS_PER_DAY,
    amount: collectedFor('growth', 'monthly'),
    currencyCode: 'INR',
  });

  async function recomputedAt(tenantId: string): Promise<number[]> {
    const rows = await pools.admin.db
      .select({ at: entitlement.recomputedAt })
      .from(entitlement)
      .where(eq(entitlement.tenantId, tenantId));
    return [...new Set(rows.map((row) => row.at.getTime()))];
  }

  it("a trial starts with the book's trial limits", async () => {
    const { tenantId } = await aTrialCompany('trial');
    expect(await entitlements.limitsOf(tenantId)).toEqual(
      asRead(bookEntitlements(IN_PACK.priceBook, null)),
    );
    expect(await recomputedAt(tenantId)).toEqual([NOW]);
  });

  it('the charge that converts a trial rewrites the limits to its tier in the same transaction', async () => {
    const { tenantId, subscriptionId } = await aTrialCompany('convert');
    const ref = `sub_entitled_${tenantId}`;
    await aCheckout(tenantId, subscriptionId, 'growth', ref);
    const paidAt = CONVERTED_AT;
    expect(await charges.recordCollected(aCharge(ref, `pay_${ref}`, NOW), paidAt)).toBe('recorded');
    // The very next read — any gate's — judges against Growth, never the trial.
    expect(await entitlements.limitsOf(tenantId)).toEqual(
      asRead(bookEntitlements(IN_PACK.priceBook, 'growth')),
    );
    const [payment] = await pools.admin.db
      .select({ recordedAt: subscriptionPayment.recordedAt })
      .from(subscriptionPayment)
      .where(eq(subscriptionPayment.subscriptionId, subscriptionId));
    expect(await recomputedAt(tenantId)).toEqual([payment?.recordedAt.getTime()]);
  });

  it('a renewal recomputes and a duplicate charge recomputes nothing', async () => {
    const { tenantId, subscriptionId } = await aTrialCompany('renew');
    const ref = `sub_renewed_${tenantId}`;
    await aCheckout(tenantId, subscriptionId, 'growth', ref);
    await charges.recordCollected(aCharge(ref, `pay_first_${ref}`, NOW), CONVERTED_AT);

    const renewal = aCharge(ref, `pay_second_${ref}`, NOW + MONTH_DAYS * MS_PER_DAY);
    expect(await charges.recordCollected(renewal, RENEWED_AT)).toBe('recorded');
    expect(await recomputedAt(tenantId)).toEqual([RENEWED_AT]);

    expect(await charges.recordCollected(renewal, RETOLD_AT)).toBe('duplicate');
    expect(await recomputedAt(tenantId)).toEqual([RENEWED_AT]);
    expect(await entitlements.limitsOf(tenantId)).toEqual(
      asRead(bookEntitlements(IN_PACK.priceBook, 'growth')),
    );
  });

  it('a recompute that fails takes the charge back with it', async () => {
    const { tenantId, subscriptionId } = await aTrialCompany('rollback');
    const charge = {
      subscriptionId,
      chargeRef: `pay_rolled_back_${tenantId}`,
      occurredAt: NOW,
      paysThrough: NOW + MONTH_DAYS * MS_PER_DAY,
      amount: collectedFor('growth', 'monthly'),
      currencyCode: 'INR',
    };
    const brokenBook = () => {
      throw new Error('the book could not give the limits');
    };
    const ref = `sub_rolled_back_${tenantId}`;
    await aCheckout(tenantId, subscriptionId, 'growth', ref);
    const repository = new ChargeAdminRepository(pools.admin.db);
    const on = await repository.collectedOn(ref);
    await expect(
      repository.recordSuccess(
        charge,
        CONVERTED_AT,
        (standing) => successEffect(standing, charge),
        brokenBook,
        IN_PACK,
        on?.kind === 'collecting' ? on.conversion : null,
      ),
    ).rejects.toThrow('the book could not give the limits');
    const payments = await pools.admin.db
      .select({ id: subscriptionPayment.id })
      .from(subscriptionPayment)
      .where(eq(subscriptionPayment.subscriptionId, subscriptionId));
    expect(payments).toEqual([]);
    expect(await recomputedAt(tenantId)).toEqual([NOW]);
  });

  it('the timers recompute a live company with no limits or with trial limits after conversion', async () => {
    // A company signed up by an older api: a trial, and no limits at all.
    const bare = await aNewCompany('bare');
    await aTrial(pools.admin.db, bare, TRIAL_ENDS_AT);
    // A company converted by an older api: its limits still the trial's.
    const { tenantId: converted, subscriptionId } = await aTrialCompany('stale');
    const ref = `sub_stale_${converted}`;
    await aCheckout(converted, subscriptionId, 'growth', ref);
    await charges.recordCollected(aCharge(ref, `pay_${ref}`, NOW), CONVERTED_AT);
    await pools.admin.db
      .update(entitlement)
      .set({ source: 'trial' })
      .where(eq(entitlement.tenantId, converted));

    await entitlements.repair(REPAIRED_AT);

    expect(await entitlements.limitsOf(bare)).toEqual(
      asRead(bookEntitlements(IN_PACK.priceBook, null)),
    );
    expect(await entitlements.limitsOf(converted)).toEqual(
      asRead(bookEntitlements(IN_PACK.priceBook, 'growth')),
    );
  });
});
