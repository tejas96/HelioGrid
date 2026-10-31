import { overageAddOn, subscriptionPayment, subscriptionStateHistory } from '@heliogrid/db';
import { IN_PACK, MS_PER_DAY, minorUnits, PAST_DUE_GRACE_DAYS } from '@heliogrid/domain';
import { platformSaleTotal, sumMinorUnits } from '@heliogrid/domain/server';
import { and, asc, eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Company, openPools, skipWithoutDatabase, unseed } from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import { invoicesOf, linesOf } from './invoice-bench';
import { overageSweep } from './overage-bench';
import {
  aReprice,
  aYearlyCompany,
  detections,
  fromTheBook,
  LinkRecordingGateway,
  linkCharge,
  RefusingLinkGateway,
  reconcileOf,
  renewalOf,
  renewalServiceOf,
  renewalTimeline,
  rowOf,
  sweep,
  type YearlyCompany,
} from './renewal-bench';
import { chargeServiceOf, RecordedAlerts, silentLogger } from './support';

/**
 * The yearly renewal, against a migrated database (`M12-11`, `M12-09`, `M12-44`, `M12-05`): a
 * company a payment link collects gets one fresh link and its `issued` invoice once its year
 * closes — the plan and the year's overage, month by month — and the link's charge buys one year
 * from the old end. Timer results are read on this suite's own rows: other suites' rows can be due
 * at the same moments.
 */

/** Later than every moment the timers suite runs at, so its runs never move these rows. */
const SUITE_YEAR = 2001;
const { convertedAt, yearEnds, nextYearEnds, sweptAt, dueAt, midJune, midJuly } =
  renewalTimeline(SUITE_YEAR);
const { starterYearly, starterDetectionBundle, detectionRate, proYearly, repricedProYearly } =
  fromTheBook;
/** June runs 5 past the monthly bundle; July stays 10 under it. Measured as one year, 25 would bill. */
const JUNE_PAST_BUNDLE = 5;
const JULY_UNDER_BUNDLE = 10;
const JUNE_OVERAGE = minorUnits(JUNE_PAST_BUNDLE * detectionRate);
/** The raise's batch (`renewal.service.ts`): more link-less rows than one page holds. */
const RAISE_BATCH = 25;
/** A monthly link row converted this many days earlier ends its period first: ahead in the queue. */
const BLOCKER_DAYS_EARLIER = 40;
const BLOCKER_CONVERTED_BEFORE = BLOCKER_DAYS_EARLIER * MS_PER_DAY;

const skip = skipWithoutDatabase(
  'YEARLY RENEWAL PROOF',
  'The renewal link, its invoice and the year it buys are UNPROVEN in this run.',
);

describe.skipIf(skip)('yearly renewal on a fresh payment link (M12-11, M12-09)', () => {
  let pools: ReturnType<typeof openPools>;
  let gateway: LinkRecordingGateway;
  let alerts: RecordedAlerts;
  let companies: Company[] = [];

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
  });

  beforeEach(() => {
    gateway = new LinkRecordingGateway();
    alerts = new RecordedAlerts(silentLogger());
  });

  afterEach(async () => {
    await unseed(pools.admin.db, { companies, people: [], memberships: [] });
    companies = [];
  });

  afterAll(async () => {
    await pools.close();
  });

  const renewalsOf = (company: YearlyCompany) => renewalOf(pools, company, nextYearEnds);
  const swept = (now: number) => sweep(pools, gateway, alerts, now);
  const paid = (at: number) => linkCharge(gateway, at, starterYearly);

  it("a closed yearly period raises one link with an issued invoice for the plan and the year's overage, once", async () => {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    await detections(pools, company, starterDetectionBundle + JUNE_PAST_BUNDLE, midJune);
    await detections(pools, company, starterDetectionBundle - JULY_UNDER_BUNDLE, midJuly);

    expect(await swept(yearEnds)).toBe(0);
    expect(await swept(sweptAt)).toBe(1);
    expect(await swept(sweptAt + MS_PER_DAY)).toBe(0);

    const [renewal, ...more] = await renewalsOf(company);
    expect(more).toEqual([]);
    expect(renewal).toMatchObject({ status: 'issued', paymentId: null, kind: 'cycle' });
    if (renewal === undefined) throw new Error('no renewal invoice');
    const lines = await linesOf(pools.admin.db, renewal.id);
    expect(lines.map((line) => line.taxableMinor)).toEqual([starterYearly, JUNE_OVERAGE]);

    const total = sumMinorUnits([starterYearly, JUNE_OVERAGE]);
    expect(gateway.opened).toHaveLength(1);
    expect(gateway.opened[0]?.request).toMatchObject({
      route: { collection: 'invoice' },
      amount: total,
      reference: renewal.id,
      expiresAt: dueAt + PAST_DUE_GRACE_DAYS * MS_PER_DAY,
    });
    const addOns = await pools.admin.db
      .select({
        status: overageAddOn.status,
        invoiceId: overageAddOn.invoiceId,
        gatewayRef: overageAddOn.gatewayRef,
        windowFrom: overageAddOn.windowFrom,
        windowTo: overageAddOn.windowTo,
      })
      .from(overageAddOn)
      .where(eq(overageAddOn.subscriptionId, company.subscriptionId))
      .orderBy(asc(overageAddOn.windowFrom));
    expect(addOns).toEqual([
      {
        status: 'invoiced',
        invoiceId: renewal.id,
        gatewayRef: gateway.opened[0]?.page.gatewayRef,
        windowFrom: new Date(`${SUITE_YEAR}-06-12T06:30:00Z`),
        windowTo: new Date(`${SUITE_YEAR}-07-12T06:30:00Z`),
      },
    ]);
  });

  it('a paid renewal link moves the paid period one year from its old end and turns its invoice paid', async () => {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    await swept(sweptAt);
    const paidAt = sweptAt + MS_PER_DAY;

    expect(await chargeServiceOf(pools, alerts).recordCollected(paid(paidAt), paidAt)).toBe(
      'recorded',
    );

    expect(await rowOf(pools, company)).toMatchObject({
      state: 'active',
      paidPeriodEnd: new Date(nextYearEnds),
    });
    const [payment] = await pools.admin.db
      .select({ id: subscriptionPayment.id, paysThrough: subscriptionPayment.paysThrough })
      .from(subscriptionPayment)
      .where(
        and(
          eq(subscriptionPayment.subscriptionId, company.subscriptionId),
          eq(subscriptionPayment.occurredAt, new Date(paidAt)),
        ),
      );
    expect(payment?.paysThrough).toEqual(new Date(nextYearEnds));
    const invoices = await invoicesOf(pools.admin.db, company.subscriptionId);
    expect(invoices).toHaveLength(2);
    expect(await renewalsOf(company)).toMatchObject([{ status: 'paid', paymentId: payment?.id }]);
    expect(alerts.raised).toEqual([]);
  });

  it('a renewal after a reprice bills the current price, leaves the paid year alone, and paying it moves the company onto that row', async () => {
    const company = await aYearlyCompany(pools, companies, 'pro', convertedAt);
    const repriced = await aReprice(pools, company, repricedProYearly);
    await swept(sweptAt);
    const [conversion, renewal, ...more] = await invoicesOf(pools.admin.db, company.subscriptionId);
    expect(more).toEqual([]);
    const taxableOf = async (id = '') =>
      (await linesOf(pools.admin.db, id)).map((line) => line.taxableMinor);
    expect(await taxableOf(renewal?.id)).toEqual([repricedProYearly]);
    expect(await taxableOf(conversion?.id)).toEqual([proYearly]);
    const total = platformSaleTotal(IN_PACK, repricedProYearly);
    expect(gateway.opened[0]?.request.amount).toBe(total);
    expect(await rowOf(pools, company)).toMatchObject({ planPriceId: company.planPriceId });

    const paidAt = sweptAt + MS_PER_DAY;
    const charge = linkCharge(gateway, paidAt, total);
    expect(await chargeServiceOf(pools, alerts).recordCollected(charge, paidAt)).toBe('recorded');
    expect(await rowOf(pools, company)).toMatchObject({
      paidPeriodEnd: new Date(nextYearEnds),
      planPriceId: repriced,
    });
    expect(alerts.raised).toEqual([]);
  });

  it('an unpaid link at its due moment fails its invoice and makes the row past due, and paying it later recovers', async () => {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    await swept(sweptAt);
    const renewals = renewalServiceOf(pools, gateway, alerts);

    await renewals.failUnpaid(dueAt - 1);
    expect(await renewalsOf(company)).toMatchObject([{ status: 'issued' }]);
    await renewals.failUnpaid(dueAt);
    await renewals.failUnpaid(dueAt + MS_PER_DAY);
    expect(await renewalsOf(company)).toMatchObject([{ status: 'failed', paymentId: null }]);
    expect(await rowOf(pools, company)).toMatchObject({
      state: 'past_due',
      stateEnteredAt: new Date(dueAt),
    });
    const history = await pools.admin.db
      .select({ state: subscriptionStateHistory.state, cause: subscriptionStateHistory.cause })
      .from(subscriptionStateHistory)
      .where(eq(subscriptionStateHistory.subscriptionId, company.subscriptionId))
      .orderBy(asc(subscriptionStateHistory.enteredAt));
    expect(history.at(-1)).toEqual({ state: 'past_due', cause: 'charge_failed' });

    const paidAt = dueAt + 2 * MS_PER_DAY;
    await chargeServiceOf(pools, alerts).recordCollected(paid(paidAt), paidAt);
    expect(await rowOf(pools, company)).toMatchObject({
      state: 'active',
      paidPeriodEnd: new Date(nextYearEnds),
    });
    expect(await renewalsOf(company)).toMatchObject([{ status: 'paid' }]);
  });

  it('the reconcile repairs a renewal charge whose message was lost', async () => {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    await swept(sweptAt);
    const paidAt = sweptAt + MS_PER_DAY;
    const charge = paid(paidAt);
    gateway.collect(charge);

    const reconcile = reconcileOf(pools, gateway, alerts);
    let after: string | null = null;
    do {
      after = (await reconcile.reconcilePage(after, paidAt + MS_PER_DAY)).after;
    } while (after !== null);

    expect(await renewalsOf(company)).toMatchObject([{ status: 'paid' }]);
    expect(await rowOf(pools, company)).toMatchObject({ paidPeriodEnd: new Date(nextYearEnds) });
    expect(alerts.raised).toContainEqual([
      'billing_repair',
      { gatewayRef: charge.gatewayRef, chargeRef: charge.chargeRef },
    ]);
  });

  it('a renewal no link went out for fails at its due moment, alerted, and leaves the queue', async () => {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    const refusing = new RefusingLinkGateway();
    const renewals = renewalServiceOf(pools, refusing, alerts);
    await overageSweep(pools, refusing, alerts).addDue(sweptAt);
    expect(await renewals.raiseDue(sweptAt)).toBe(0);

    await renewals.failUnpaid(dueAt - 1);
    expect(await rowOf(pools, company)).toMatchObject({ state: 'active' });
    await renewals.failUnpaid(dueAt);
    expect(await rowOf(pools, company)).toMatchObject({
      state: 'past_due',
      stateEnteredAt: new Date(dueAt),
    });
    expect(alerts.raised).toContainEqual([
      'billing_renewal_not_raised',
      { subscriptionId: company.subscriptionId },
    ]);
    expect(await renewalServiceOf(pools, gateway, alerts).raiseDue(dueAt + 1)).toBe(0);
  });

  it('a renewal raised before its overage is reckoned goes out on time, and the late add-ons wait for the next link', async () => {
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);
    await detections(pools, company, starterDetectionBundle + JUNE_PAST_BUNDLE, midJune);
    const renewals = renewalServiceOf(pools, gateway, alerts);

    await renewals.failUnpaid(sweptAt);
    expect(await renewals.raiseDue(sweptAt)).toBe(1);
    const [renewal] = await renewalsOf(company);
    if (renewal === undefined) throw new Error('no renewal invoice');
    expect((await linesOf(pools.admin.db, renewal.id)).map((line) => line.taxableMinor)).toEqual([
      starterYearly,
    ]);
    await overageSweep(pools, gateway, alerts).addDue(sweptAt);
    const late = await pools.admin.db
      .select({ status: overageAddOn.status })
      .from(overageAddOn)
      .where(eq(overageAddOn.subscriptionId, company.subscriptionId));
    expect(late).toEqual([{ status: 'pending' }]);
    await renewals.failUnpaid(dueAt - 1);
    expect(await rowOf(pools, company)).toMatchObject({ state: 'active' });
  });

  it('rows the pack no longer sells by link never hold back a renewal behind them', async () => {
    const blockers = RAISE_BATCH + 1;
    for (let index = 0; index < blockers; index += 1) {
      await aYearlyCompany(
        pools,
        companies,
        'starter',
        yearEnds - BLOCKER_CONVERTED_BEFORE,
        'monthly',
      );
    }
    const company = await aYearlyCompany(pools, companies, 'starter', convertedAt);

    expect(await renewalServiceOf(pools, gateway, alerts).raiseDue(sweptAt)).toBe(1);
    expect(await renewalsOf(company)).toMatchObject([{ status: 'issued' }]);
  });
});
