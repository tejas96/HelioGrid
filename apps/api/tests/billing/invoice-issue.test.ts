import { randomUUID } from 'node:crypto';
import { subscription, taxRegistration } from '@heliogrid/db';
import {
  type BillingState,
  type ChargeSucceeded,
  IN_PACK,
  MS_PER_DAY,
  minorUnits,
  PAST_DUE_GRACE_DAYS,
  successEffect,
} from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ChargeAdminRepository } from '../../src/modules/billing/charge.admin.repository';
import {
  aCompany,
  type Company,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import { invoicesOf, linesOf, paymentsOf } from './invoice-bench';
import {
  aPlan,
  chargeServiceOf,
  collectedFor,
  entitlementServiceOf,
  RecordedAlerts,
  silentLogger,
} from './support';

/**
 * Subscription invoicing, against a migrated database (`M12-09`, `M12-44`, `M12-45`): every
 * recorded payment issues its invoice in its own transaction, numbered in one gapless series a
 * fiscal year. Every moment sits in 1971, a fiscal year no other suite issues in, so the series
 * this suite reads is its own.
 */

const skip = skipWithoutDatabase(
  'INVOICE ISSUE PROOF',
  'The invoice a payment issues, and its number, are UNPROVEN in this run.',
);

const ENTERED_AT = Date.parse('1971-06-01T06:00:00Z');
const DAYS_TO_PAY = 2;
const PERIOD_DAYS = 30;
const PAID_AT = ENTERED_AT + DAYS_TO_PAY * MS_PER_DAY;
const PAYS_THROUGH = PAID_AT + PERIOD_DAYS * MS_PER_DAY;
/** The payment is recorded a minute after the gateway took it. */
const MS_PER_MINUTE = 60_000;
const ISSUED_AT = PAID_AT + MS_PER_MINUTE;
const TRIAL_END_FAR_AWAY = Date.parse('2100-01-01T00:00:00Z');
/** A month of Growth, as the unregistered platform collects it: the list price alone. */
const GROWTH_MONTH = collectedFor('growth', 'monthly');

const OURS = { registrationType: 'IN_GST', value: '27AAACH7409R1ZV' };
const REGISTERED = { ...IN_PACK, tax: { ...IN_PACK.tax, platformRegistration: OURS } };
const THEIRS = '29ABCDE1234F1Z5';

describe.skipIf(skip)('subscription invoicing (M12-09, M12-44, M12-45)', () => {
  let pools: ReturnType<typeof openPools>;
  let companies: Company[] = [];

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
  });

  afterEach(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    companies = [];
  });

  afterAll(async () => {
    await pools.close();
  });

  /** A company holding one subscription in `state`, converted onto Growth monthly unless `planless`. */
  async function aSubscriptionIn(
    state: BillingState,
    enteredAt = ENTERED_AT,
    { planless = false } = {},
  ): Promise<{ tenantId: string; subscriptionId: string }> {
    const company = aCompany(`Invoice Issue ${randomUUID()}`);
    companies.push(company);
    await seed(pools.admin.db, { companies: [company], people: [], memberships: [] });
    const [held] = await pools.admin.db
      .insert(subscription)
      .values({
        tenantId: company.tenantId,
        state,
        stateEnteredAt: new Date(enteredAt),
        trialEndsAt: new Date(TRIAL_END_FAR_AWAY),
        paidPeriodEnd: new Date(enteredAt),
        createdAt: new Date(enteredAt),
        ...(planless ? {} : await aPlan(pools.admin.db)),
      })
      .returning({ id: subscription.id });
    if (held === undefined) throw new Error('the subscription was not seeded');
    return { tenantId: company.tenantId, subscriptionId: held.id };
  }

  function aCharge(subscriptionId: string, overrides: Partial<ChargeSucceeded> = {}) {
    return {
      subscriptionId,
      chargeRef: `charge_${randomUUID()}`,
      occurredAt: PAID_AT,
      paysThrough: PAYS_THROUGH,
      amount: GROWTH_MONTH,
      currencyCode: 'INR',
      ...overrides,
    } satisfies ChargeSucceeded;
  }

  /** The charge path's one transaction, handed a pack of the suite's choosing. */
  function recordOnPack(charge: ChargeSucceeded, pack: typeof IN_PACK) {
    return new ChargeAdminRepository(pools.admin.db).recordSuccess(
      charge,
      ISSUED_AT,
      (standing) => successEffect(standing, charge),
      entitlementServiceOf(pools).bookLimitsOf(pack),
      pack,
    );
  }

  /** The place of a number in its year's series: `1971-72/000042` → 42. */
  const sequenceOf = (number: string): number => Number(number.split('/')[1]);

  it('a recorded charge issues one paid invoice naming its payment', async () => {
    const { subscriptionId } = await aSubscriptionIn('active');

    expect(await chargeServiceOf(pools).recordSuccess(aCharge(subscriptionId), ISSUED_AT)).toBe(
      'recorded',
    );

    const [payment] = await paymentsOf(pools.admin.db, subscriptionId);
    const invoices = await invoicesOf(pools.admin.db, subscriptionId);
    expect(invoices).toHaveLength(1);
    const [invoice] = invoices;
    expect(invoice).toMatchObject({
      paymentId: payment?.id,
      kind: 'cycle',
      status: 'paid',
      currencyCode: 'INR',
      paysThrough: new Date(PAYS_THROUGH),
      issuedAt: new Date(ISSUED_AT),
      // The unregistered platform's plain invoice: no registration of its own, no tax.
      supplierRegistrationType: null,
      supplierRegistration: null,
      supplierPlace: null,
      recipientPlace: null,
      serviceCode: null,
    });
    expect(invoice?.number).toMatch(/^1971-72\/\d{6}$/);
    expect(await linesOf(pools.admin.db, invoice?.id ?? '')).toEqual([
      { position: 0, taxableMinor: GROWTH_MONTH, rateBasisPoints: null, taxes: [] },
    ]);
  });

  it('the same charge told twice issues one invoice', async () => {
    const { subscriptionId } = await aSubscriptionIn('active');
    const charge = aCharge(subscriptionId);
    const charges = chargeServiceOf(pools);

    await charges.recordSuccess(charge, ISSUED_AT);
    expect(await charges.recordSuccess(charge, ISSUED_AT + 1)).toBe('duplicate');

    expect(await invoicesOf(pools.admin.db, subscriptionId)).toHaveLength(1);
  });

  it('a charge on a dead subscription still issues its invoice', async () => {
    const haltedAt = ENTERED_AT + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
    const { subscriptionId } = await aSubscriptionIn('halted', haltedAt);
    const charge = aCharge(subscriptionId, { occurredAt: haltedAt });

    expect(await chargeServiceOf(pools).recordSuccess(charge, ISSUED_AT)).toBe('dead');

    const [payment] = await paymentsOf(pools.admin.db, subscriptionId);
    const invoices = await invoicesOf(pools.admin.db, subscriptionId);
    expect(invoices.map((invoice) => invoice.paymentId)).toEqual([payment?.id]);
  });

  it('an invoice that cannot be issued leaves no payment behind', async () => {
    const { subscriptionId } = await aSubscriptionIn('active', ENTERED_AT, { planless: true });

    await expect(
      chargeServiceOf(pools).recordSuccess(aCharge(subscriptionId), ISSUED_AT),
    ).rejects.toThrow('buys no plan');

    expect(await paymentsOf(pools.admin.db, subscriptionId)).toEqual([]);
    expect(await invoicesOf(pools.admin.db, subscriptionId)).toEqual([]);
  });

  it('an invoice keeps both registrations as they stood when it issued', async () => {
    const { tenantId, subscriptionId } = await aSubscriptionIn('active');
    await pools.admin.db.insert(taxRegistration).values({
      tenantId,
      registrationType: 'IN_GST',
      value: THEIRS,
      createdAt: new Date(ENTERED_AT),
    });
    const registeredTotal = platformSaleTotal(REGISTERED, GROWTH_MONTH);

    expect(
      await recordOnPack(aCharge(subscriptionId, { amount: registeredTotal }), REGISTERED),
    ).toEqual({ kind: 'recorded', invoiced: registeredTotal });
    // The company changes its GSTIN afterwards: the invoice already issued does not move.
    await pools.admin.db
      .update(taxRegistration)
      .set({ value: '27ABCDE1234F1Z5' })
      .where(eq(taxRegistration.tenantId, tenantId));

    const [invoice] = await invoicesOf(pools.admin.db, subscriptionId);
    expect(invoice).toMatchObject({
      supplierRegistrationType: 'IN_GST',
      supplierRegistration: OURS.value,
      recipientRegistrationType: 'IN_GST',
      recipientRegistration: THEIRS,
      supplierPlace: '27',
      recipientPlace: '29',
      serviceCode: '998434',
    });
    expect(await linesOf(pools.admin.db, invoice?.id ?? '')).toEqual([
      {
        position: 0,
        taxableMinor: GROWTH_MONTH,
        rateBasisPoints: 1800,
        taxes: [{ code: 'IGST', amount: registeredTotal - GROWTH_MONTH }],
      },
    ]);
  });

  it('invoice numbers run without a gap inside a fiscal year', async () => {
    const first = await aSubscriptionIn('active');
    const broken = await aSubscriptionIn('active', ENTERED_AT, { planless: true });
    const second = await aSubscriptionIn('active');
    const charges = chargeServiceOf(pools);

    await charges.recordSuccess(aCharge(first.subscriptionId), ISSUED_AT);
    // A payment whose invoice fails rolls back, and its number with it.
    await expect(
      charges.recordSuccess(aCharge(broken.subscriptionId), ISSUED_AT),
    ).rejects.toThrow();
    await charges.recordSuccess(aCharge(second.subscriptionId), ISSUED_AT);

    const [before] = await invoicesOf(pools.admin.db, first.subscriptionId);
    const [after] = await invoicesOf(pools.admin.db, second.subscriptionId);
    expect(sequenceOf(after?.number ?? '')).toBe(sequenceOf(before?.number ?? '') + 1);
  });

  it.each([
    { name: 'a charge that collected the invoice total raises nothing', extra: 0, alerts: [] },
    {
      name: 'a charge that differs from its invoice raises an alert',
      extra: 100,
      alerts: ['billing_invoice_mismatch'],
    },
  ])('$name', async ({ extra, alerts }) => {
    const { subscriptionId } = await aSubscriptionIn('active');
    const recorded = new RecordedAlerts(silentLogger());
    const charge = aCharge(subscriptionId, { amount: minorUnits(GROWTH_MONTH + extra) });

    await chargeServiceOf(pools, recorded).recordSuccess(charge, ISSUED_AT);

    expect(recorded.raised.map(([alert]) => alert)).toEqual(alerts);
  });
});
