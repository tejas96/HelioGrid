import { randomUUID } from 'node:crypto';
import { subscription } from '@heliogrid/db';
import { IN_PACK, type MinorUnits, MS_PER_DAY, minorUnits, successEffect } from '@heliogrid/domain';
import { platformSaleTotal, sumMinorUnits } from '@heliogrid/domain/server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ChargeAdminRepository } from '../../src/modules/billing/charge.admin.repository';
import type { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { OverageService } from '../../src/modules/billing/overage.service';
import { type Company, openPools, skipWithoutDatabase, unseed } from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import { invoicesOf, linesOf } from './invoice-bench';
import {
  aDebit,
  addOnsOf,
  aMandate,
  debit,
  type Mandate,
  overageSweep,
  timeline,
  use,
} from './overage-bench';
import { aDevelopmentGateway, entitlementServiceOf, RecordedAlerts, silentLogger } from './support';

/**
 * Overage add-ons, against a migrated database (`M12-35`, `M12-44`): a closed mandate period's use
 * past the company's allowance is reckoned at the book's rates, added to the mandate's next debit,
 * and listed on that debit's invoice.
 */

/** A year no other suite charges in, so the periods the sweep finds are this suite's. */
const SUITE_YEAR = 1974;
const PERIODS = timeline(SUITE_YEAR);
const { MAY, JUNE, JULY, AUGUST, MID_MAY, MID_JUNE, MAY_SETTLED } = PERIODS;

const skip = skipWithoutDatabase(
  'OVERAGE ADD-ON PROOF',
  'Overage billed on the next debit, and its invoice lines, are UNPROVEN in this run.',
);

const SECONDS_PER_MINUTE = 60;
const rateOf = (meter: 'voice_minutes' | 'ai_roof_detections'): MinorUnits => {
  const overage = IN_PACK.priceBook.overage[meter];
  if (overage.kind !== 'per_unit') throw new Error(`the IN book bills ${meter} per unit`);
  return overage.rate;
};
const STARTER_DETECTIONS =
  IN_PACK.priceBook.tiers.starter?.capacity.meterBundles.ai_roof_detections;
if (typeof STARTER_DETECTIONS !== 'number') throw new Error('Starter carries a detection bundle');

/** May on Starter (voice bundle 0): 130 whole minutes and 59 seconds of a minute not finished. */
const MAY_MINUTES = 130;
const UNFINISHED_SECONDS = 59;
const DETECTIONS_PAST_BUNDLE = 2;
/** A call in June: June's period's, never May's. */
const JUNE_CALL_SECONDS = 600;
const VOICE_MAY = minorUnits(MAY_MINUTES * rateOf('voice_minutes'));
const DETECTIONS_MAY = minorUnits(DETECTIONS_PAST_BUNDLE * rateOf('ai_roof_detections'));

/**
 * Against UPI AutoPay's ₹15,000 debit cap with Starter's ₹1,999 plan: 2,000 minutes (₹12,000) fit,
 * 200 more detections (₹2,000) then do not fit beside them, and 2,200 minutes (₹13,200) fit no debit.
 */
const MINUTES_THAT_FIT = 2_000;
const DETECTIONS_THAT_WAIT = 200;
const MINUTES_THAT_NEVER_FIT = 2_200;

const OURS = { registrationType: 'IN_GST', value: '27AAACH7409R1ZV' };
const REGISTERED = { ...IN_PACK, tax: { ...IN_PACK.tax, platformRegistration: OURS } };

describe.skipIf(skip)('overage add-ons (M12-35)', () => {
  let pools: ReturnType<typeof openPools>;
  let companies: Company[] = [];
  let gateway: DevelopmentBillingGateway;
  let alerts: RecordedAlerts;
  let sweep: OverageService;

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
  });

  beforeEach(() => {
    gateway = aDevelopmentGateway();
    alerts = new RecordedAlerts(silentLogger());
    sweep = overageSweep(pools, gateway, alerts);
  });

  afterEach(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    companies = [];
  });

  afterAll(async () => {
    await pools.close();
  });

  async function aStarterMayOverBundle(): Promise<Mandate> {
    const mandate = await aMandate(pools, companies, 'starter', PERIODS);
    const voiceSeconds = MAY_MINUTES * SECONDS_PER_MINUTE + UNFINISHED_SECONDS;
    await use(pools, mandate, 'voice_minutes', voiceSeconds, MID_MAY);
    const detections = Number(STARTER_DETECTIONS) + DETECTIONS_PAST_BUNDLE;
    await use(pools, mandate, 'ai_roof_detections', detections, MID_MAY);
    await use(pools, mandate, 'voice_minutes', JUNE_CALL_SECONDS, MID_JUNE);
    return mandate;
  }

  it("a closed period's add-on equals its ledgered overage past the company's allowance at the book's published rate", async () => {
    const mandate = await aStarterMayOverBundle();

    expect(await sweep.addDue(MAY_SETTLED)).toEqual({ reckoned: 2, added: 2 });

    const added = {
      windowFrom: new Date(MAY),
      windowTo: new Date(JUNE),
      status: 'added',
      gatewayRef: mandate.gatewayRef,
      invoiceId: null,
    };
    expect(await addOnsOf(pools, mandate)).toEqual([
      {
        ...added,
        meter: 'voice_minutes',
        used: MAY_MINUTES,
        allowance: 0,
        quantity: MAY_MINUTES,
        unitRateMinor: rateOf('voice_minutes'),
        amountMinor: VOICE_MAY,
      },
      {
        ...added,
        meter: 'ai_roof_detections',
        used: Number(STARTER_DETECTIONS) + DETECTIONS_PAST_BUNDLE,
        allowance: STARTER_DETECTIONS,
        quantity: DETECTIONS_PAST_BUNDLE,
        unitRateMinor: rateOf('ai_roof_detections'),
        amountMinor: DETECTIONS_MAY,
      },
    ]);
    // The unregistered platform's gateway collects the ex-tax amount (F1-29).
    const atGateway = gateway.addedTo(mandate.gatewayRef);
    expect(atGateway.map(({ meter, amount }) => [meter, amount])).toEqual([
      ['voice_minutes', VOICE_MAY],
      ['ai_roof_detections', DETECTIONS_MAY],
    ]);
  });

  it('a second sweep reckons and adds nothing again', async () => {
    const mandate = await aStarterMayOverBundle();
    await sweep.addDue(MAY_SETTLED);

    expect(await sweep.addDue(MAY_SETTLED + MS_PER_DAY)).toEqual({ reckoned: 0, added: 0 });
    expect(gateway.addedTo(mandate.gatewayRef)).toHaveLength(2);
    expect(await addOnsOf(pools, mandate)).toHaveLength(2);
  });

  it('a debit after an added overage issues one invoice with the plan line and one add-on line per meter, taxed by place once the platform is registered', async () => {
    const plain = await aStarterMayOverBundle();
    await sweep.addDue(MAY_SETTLED);
    const julyTotal = sumMinorUnits([plain.planAmount, VOICE_MAY, DETECTIONS_MAY]);

    expect(await debit(pools, plain, JULY, AUGUST, julyTotal)).toBe('recorded');

    const julyInvoice = (await invoicesOf(pools.admin.db, plain.subscriptionId)).at(-1);
    expect(await linesOf(pools.admin.db, julyInvoice?.id ?? '')).toEqual([
      { position: 0, taxableMinor: plain.planAmount, rateBasisPoints: null, taxes: [] },
      { position: 1, taxableMinor: VOICE_MAY, rateBasisPoints: null, taxes: [] },
      { position: 2, taxableMinor: DETECTIONS_MAY, rateBasisPoints: null, taxes: [] },
    ]);
    const invoiced = (await addOnsOf(pools, plain)).map(({ status, invoiceId }) => [
      status,
      invoiceId,
    ]);
    expect(invoiced).toEqual([
      ['invoiced', julyInvoice?.id],
      ['invoiced', julyInvoice?.id],
    ]);

    // Registered: the same lines carry the scheme's split at the supplier's place, since the
    // company gave no registration of its own (F1-29).
    const taxed = await aStarterMayOverBundle();
    await sweep.addDue(MAY_SETTLED);
    const charge = aDebit(taxed, JULY, AUGUST);
    await new ChargeAdminRepository(pools.admin.db).recordSuccess(
      charge,
      JULY,
      (standing) => successEffect(standing, charge),
      entitlementServiceOf(pools).bookLimitsOf(REGISTERED),
      REGISTERED,
    );
    const taxedInvoice = (await invoicesOf(pools.admin.db, taxed.subscriptionId)).at(-1);
    const lines = await linesOf(pools.admin.db, taxedInvoice?.id ?? '');
    const rate = REGISTERED.tax.platformSale.rateBasisPoints;
    expect(lines.map((line) => [line.taxableMinor, line.rateBasisPoints])).toEqual([
      [taxed.planAmount, rate],
      [VOICE_MAY, rate],
      [DETECTIONS_MAY, rate],
    ]);
    for (const line of lines) {
      expect(line.taxes.map((tax) => tax.code)).toEqual(['CGST', 'SGST']);
      const tax = line.taxes.reduce((sum, component) => sum + component.amount, 0);
      const collected = platformSaleTotal(REGISTERED, minorUnits(line.taxableMinor));
      expect(line.taxableMinor + tax).toBe(collected);
    }
  });

  it('an add-on that does not fit under the mandate cap waits, and one that never fits is marked over cap', async () => {
    const waits = await aMandate(pools, companies, 'starter', PERIODS);
    await use(pools, waits, 'voice_minutes', MINUTES_THAT_FIT * SECONDS_PER_MINUTE, MID_MAY);
    const detections = Number(STARTER_DETECTIONS) + DETECTIONS_THAT_WAIT;
    await use(pools, waits, 'ai_roof_detections', detections, MID_MAY);
    const never = await aMandate(pools, companies, 'starter', PERIODS);
    const neverSeconds = MINUTES_THAT_NEVER_FIT * SECONDS_PER_MINUTE;
    await use(pools, never, 'voice_minutes', neverSeconds, MID_MAY);

    await sweep.addDue(MAY_SETTLED);

    expect((await addOnsOf(pools, waits)).map(({ meter, status }) => [meter, status])).toEqual([
      ['voice_minutes', 'added'],
      ['ai_roof_detections', 'pending'],
    ]);
    expect((await addOnsOf(pools, never)).map(({ status }) => status)).toEqual(['over_cap']);
    expect(gateway.addedTo(never.gatewayRef)).toEqual([]);
    expect(alerts.raised.map(([alert]) => alert)).toEqual(['billing_overage_over_cap']);
  });

  it('a charge on a new mandate puts the add-ons waiting on the old one back to pending', async () => {
    const mandate = await aStarterMayOverBundle();
    await sweep.addDue(MAY_SETTLED);
    // A new pick converted the company onto a fresh mandate; the old one is cancelled.
    await pools.admin.db
      .update(subscription)
      .set({ gatewayRef: `sub_${randomUUID()}` })
      .where(eq(subscription.id, mandate.subscriptionId));

    expect(await debit(pools, mandate, JULY, AUGUST)).toBe('recorded');

    const julyInvoice = (await invoicesOf(pools.admin.db, mandate.subscriptionId)).at(-1);
    expect(await linesOf(pools.admin.db, julyInvoice?.id ?? '')).toHaveLength(1);
    const back = (await addOnsOf(pools, mandate)).map(({ status, gatewayRef }) => [
      status,
      gatewayRef,
    ]);
    expect(back).toEqual([
      ['pending', null],
      ['pending', null],
    ]);
  });
});
