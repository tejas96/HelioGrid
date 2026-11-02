import { billingCheckout, overageAddOn, subscription } from '@heliogrid/db';
import { MS_PER_DAY, minorUnits } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import { type Company, openPools, skipWithoutDatabase, unseed } from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import { overageSweep } from './overage-bench';
import { aYearlyCompany, LinkRecordingGateway, renewalOf, sweep } from './renewal-bench';
import {
  aVoiceAllowance,
  chargeServiceOf,
  RecordedAlerts,
  silentLogger,
  voiceMinutes,
} from './support';

/**
 * D387, `M12-57` — a row whose mandate a plan change ended renews through a fresh hosted page on
 * its plan's rail, at the moment the link rows renew: a monthly self-serve plan on a NEW mandate
 * the Owner approves, never a second live one. Once paid, the row is collected on that page.
 * A row whose mandate still collects is never asked for one.
 */

const skip = skipWithoutDatabase(
  'ENDING MANDATE RENEWAL PROOF',
  'The renewal of a row whose mandate a plan change ended is UNPROVEN in this run.',
);

/** A year of its own: the sweep reads every company, and suites run side by side. */
const SUITE_YEAR = 2005;
const convertedAt = Date.parse(`${SUITE_YEAR}-03-12T06:30:00Z`);
const monthEnds = cycleEnd(convertedAt, 'monthly');
const sweptAt = monthEnds + 2 * MS_PER_DAY;
const midPeriod = convertedAt + 10 * MS_PER_DAY;
/** A 20-minute monthly allowance, run 5 past: one voice add-on for the period. */
const VOICE_ALLOWANCE = 20;
const PAST_BUNDLE = 5;

describe.skipIf(skip)('a row whose mandate a plan change ended renews on a fresh page', () => {
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

  /** A Starter monthly company on a mandate; `ending` when a plan change told it to stop. */
  async function aMandateCompany(ending: boolean) {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt, 'monthly');
    await pools.admin.db
      .update(subscription)
      .set({ collection: 'mandate', mandateEndingAt: ending ? new Date(convertedAt) : null })
      .where(eq(subscription.id, company.subscriptionId));
    return company;
  }

  /** The fresh page's first charge, as the gateway reports it, through the charge path. */
  async function payFreshPage(
    gateway: LinkRecordingGateway,
    alerts: RecordedAlerts,
    invoiceId: string | undefined,
  ) {
    const opened = gateway.opened.find((one) => one.request.reference === invoiceId);
    const ref = opened?.page.gatewayRef ?? '';
    const recorded = await chargeServiceOf(pools, alerts).recordCollected(
      {
        gatewayRef: ref,
        chargeRef: `pay_${ref}`,
        occurredAt: sweptAt,
        paysThrough: null,
        amount: opened?.request.amount ?? minorUnits(0),
        currencyCode: 'INR',
      },
      sweptAt,
    );
    return { opened, ref, recorded };
  }

  it('a row an older api converted, with no rail of its own, renews on its checkout’s rail', async () => {
    const gateway = new LinkRecordingGateway();
    const alerts = new RecordedAlerts(silentLogger());
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    await pools.admin.db
      .update(subscription)
      .set({ collection: null })
      .where(eq(subscription.id, company.subscriptionId));

    await sweep(pools, gateway, alerts, company.yearEnds + 2 * MS_PER_DAY);

    const [renewal] = await renewalOf(pools, company, cycleEnd(company.yearEnds, 'yearly'));
    expect(renewal?.status).toBe('issued');
    const opened = gateway.opened.find((one) => one.request.reference === renewal?.id);
    expect(opened?.request.route.collection).toBe('invoice');
  });

  it('the period’s overage rides the new mandate’s next debit, never its first', async () => {
    const gateway = new LinkRecordingGateway();
    const alerts = new RecordedAlerts(silentLogger());
    const ending = await aMandateCompany(true);
    await aVoiceAllowance(pools, ending.tenantId, VOICE_ALLOWANCE);
    await voiceMinutes(pools, ending.tenantId, VOICE_ALLOWANCE + PAST_BUNDLE, midPeriod);

    await sweep(pools, gateway, alerts, sweptAt);

    const [renewal] = await renewalOf(pools, ending, cycleEnd(monthEnds, 'monthly'));
    const addOns = () =>
      pools.admin.db
        .select({ status: overageAddOn.status, invoiceId: overageAddOn.invoiceId })
        .from(overageAddOn)
        .where(eq(overageAddOn.subscriptionId, ending.subscriptionId));
    expect(await addOns()).toEqual([{ status: 'pending', invoiceId: null }]);
    const { opened, ref, recorded } = await payFreshPage(gateway, alerts, renewal?.id);
    expect(opened?.request.route.collection).toBe('mandate');
    expect(recorded).toBe('recorded');
    expect(alerts.raised.map(([alert]) => alert)).not.toContain('billing_invoice_mismatch');

    await overageSweep(pools, gateway, alerts).addDue(sweptAt + MS_PER_DAY);

    expect(gateway.addedTo(ref)).toHaveLength(1);
    expect((await addOns()).map((addOn) => addOn.status)).toEqual(['added']);
  });

  it('a fresh page an older api recorded is made the row’s own before any other is raised', async () => {
    const gateway = new LinkRecordingGateway();
    const alerts = new RecordedAlerts(silentLogger());
    const ending = await aMandateCompany(true);
    const [before] = await pools.admin.db
      .select({
        gatewayRef: subscription.gatewayRef,
        mandateEndingAt: subscription.mandateEndingAt,
      })
      .from(subscription)
      .where(eq(subscription.id, ending.subscriptionId));
    await sweep(pools, gateway, alerts, sweptAt);
    const [renewal] = await renewalOf(pools, ending, cycleEnd(monthEnds, 'monthly'));
    const { ref } = await payFreshPage(gateway, alerts, renewal?.id);
    // An older api recorded that charge: it paid the invoice and the period, adopted nothing.
    await pools.admin.db.delete(billingCheckout).where(eq(billingCheckout.gatewayRef, ref));
    await pools.admin.db
      .update(subscription)
      .set({ gatewayRef: before?.gatewayRef, mandateEndingAt: before?.mandateEndingAt })
      .where(eq(subscription.id, ending.subscriptionId));

    const nextEnds = cycleEnd(monthEnds, 'monthly');
    const later = new LinkRecordingGateway();
    await sweep(pools, later, alerts, nextEnds + 2 * MS_PER_DAY);

    expect(await renewalOf(pools, ending, cycleEnd(nextEnds, 'monthly'))).toEqual([]);
    const [row] = await pools.admin.db
      .select()
      .from(subscription)
      .where(eq(subscription.id, ending.subscriptionId));
    expect(row).toMatchObject({ gatewayRef: ref, mandateEndingAt: null, collection: 'mandate' });
  });

  it('renews through a new mandate page, and is collected on it once paid', async () => {
    const gateway = new LinkRecordingGateway();
    const alerts = new RecordedAlerts(silentLogger());
    const ending = await aMandateCompany(true);
    const collecting = await aMandateCompany(false);

    await sweep(pools, gateway, alerts, sweptAt);

    const [renewal] = await renewalOf(pools, ending, cycleEnd(monthEnds, 'monthly'));
    expect(renewal?.status).toBe('issued');
    const opened = gateway.opened.find((one) => one.request.reference === renewal?.id);
    expect(opened?.request.route.collection).toBe('mandate');
    // A mandate that still collects is never asked for a second.
    expect(await renewalOf(pools, collecting, cycleEnd(monthEnds, 'monthly'))).toEqual([]);

    const newRef = opened?.page.gatewayRef ?? '';
    const recorded = await chargeServiceOf(pools, alerts).recordCollected(
      {
        gatewayRef: newRef,
        chargeRef: `pay_${newRef}`,
        occurredAt: sweptAt,
        paysThrough: null,
        amount: opened?.request.amount ?? minorUnits(0),
        currencyCode: 'INR',
      },
      sweptAt,
    );
    expect(recorded).toBe('recorded');

    const [row] = await pools.admin.db
      .select()
      .from(subscription)
      .where(eq(subscription.id, ending.subscriptionId));
    expect(row).toMatchObject({
      state: 'active',
      gatewayRef: newRef,
      collection: 'mandate',
      mandateEndingAt: null,
    });
    expect(row?.paidPeriodEnd?.getTime()).toBe(cycleEnd(monthEnds, 'monthly'));
    const [page] = await pools.admin.db
      .select({ collection: billingCheckout.collection, closedAt: billingCheckout.closedAt })
      .from(billingCheckout)
      .where(eq(billingCheckout.gatewayRef, newRef));
    expect(page?.collection).toBe('mandate');
    expect(page?.closedAt).not.toBeNull();
  });
});
