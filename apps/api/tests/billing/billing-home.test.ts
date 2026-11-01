import {
  type BillingHome,
  type BillingStanding,
  billingHomeSchema,
  billingStandingSchema,
} from '@heliogrid/contracts';
import {
  ENTITLEMENT_BUFFER_DAYS,
  IN_PACK,
  METERED_PAUSE_DAY,
  PAST_DUE_GRACE_DAYS,
  trialCapacity,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutHarness } from '../support/http';
import {
  type HomeBench as Bench,
  daysFromNow,
  decimal,
  HomeBench,
  type HomeCompany,
  iso,
  todaysSale,
} from './home-bench';
import { aPlan, collectedFor } from './support';

const skip = skipWithoutHarness(
  'BILLING HOME PROOF',
  'The billing home and its standing are UNPROVEN to answer each state in this run.',
);

const TRIAL_CAPS = trialCapacity(IN_PACK.priceBook);
const TRIAL_DAYS_LEFT = 7;
/** Paid two days ago: inside the first cycle's refund window, and two days into a failure. */
const PAID_DAYS_AGO = 2;
const PERIOD_DAYS_LEFT = 28;
const HALTED_DAYS_AGO = 10;
const EXPIRED_DAYS_AGO = 3;
const CANCELLED_RUNS_DAYS = 10;
const RENEWS_IN_DAYS = 5;
const PAID_YEAR_DAYS_AGO = 360;
const MEMBER_PAST_DUE_DAYS = 5;

describe.skipIf(skip)('GET /billing/standing and /billing/home (SCR-M12-02, M12-56)', () => {
  let bench: Bench;

  beforeAll(async () => {
    bench = await HomeBench.open();
  });

  afterAll(async () => {
    await bench?.close();
  });

  async function homeOf(held: HomeCompany): Promise<BillingHome> {
    const reply = await bench.get<BillingHome>('/billing/home', await held.owner());
    expect(reply.status).toBe(HttpStatus.OK);
    return billingHomeSchema.parse(reply.body);
  }

  it('each of the six states answers its surfaces and its one act', async () => {
    // Trialing: no plan, no money owed, no act but picking a plan.
    const trial = await bench.aCompany('Surya Trial', TRIAL_DAYS_LEFT);
    const onTrial = await homeOf(trial);
    expect(onTrial.standing).toMatchObject({ state: 'trialing', phase: 'trialing', tier: null });
    expect(onTrial.standing.trialEndsAt).not.toBeNull();
    expect(onTrial).toMatchObject({
      plan: { listPrice: null, nextBill: null },
      method: { standing: 'none', label: null, manageUrl: null },
      due: null,
      renewal: null,
      refund: null,
      reactivation: null,
      cancellable: false,
      includes: {
        designCeilingKw: TRIAL_CAPS.designCeilingKw,
        voiceMinutesIncluded: TRIAL_CAPS.meterBundles.voice_minutes,
        storageGb: TRIAL_CAPS.storageGb,
        voiceMinuteRate: null,
      },
      invoices: { latest: [], totalCount: 0 },
    });
    expect(onTrial.usage.map((meter) => meter.meter).sort()).toEqual(['storage', 'voice_minutes']);

    // Active on a Growth mandate, paid two days ago: the next bill, the live mandate, the refund.
    const active = await bench.aCompany('Surya Active');
    const activePlan = await aPlan(bench.pools.admin.db, 'growth', 'monthly');
    const periodEnd = daysFromNow(PERIOD_DAYS_LEFT);
    const paidAt = daysFromNow(-PAID_DAYS_AGO);
    await bench.put(active, 'active', { enteredAt: paidAt, paidPeriodEnd: periodEnd }, activePlan);
    const activePage = await bench.aMandatePage(active, activePlan);
    const paymentId = await bench.aPayment(active, activePlan, paidAt, periodEnd);
    await bench.anInvoice(active, activePlan, { status: 'paid', issuedAt: paidAt, paymentId });
    const onActive = await homeOf(active);
    expect(onActive.standing).toMatchObject({
      state: 'active',
      phase: 'active',
      collection: 'mandate',
    });
    expect(onActive).toMatchObject({
      plan: {
        listPrice: todaysSale('growth', 'monthly').list,
        nextBill: { at: iso(periodEnd), sale: todaysSale('growth', 'monthly') },
      },
      method: { standing: 'live', label: { en: 'UPI AutoPay' }, manageUrl: activePage },
      due: null,
      renewal: null,
      refund: { amount: decimal(collectedFor('growth', 'monthly')) },
      reactivation: null,
      cancellable: true,
      includes: {
        designCeilingKw: IN_PACK.priceBook.tiers.growth?.capacity.designCeilingKw,
        storageGb: IN_PACK.priceBook.tiers.growth?.capacity.storageGb,
      },
    });
    expect(onActive.invoices.totalCount).toBe(1);

    // Past due two days: the amount the debit asked, and the mandate's page pays it.
    const pastDue = await bench.aCompany('Surya Past Due');
    const pastDuePlan = await aPlan(bench.pools.admin.db, 'growth', 'monthly');
    await bench.put(pastDue, 'past_due', { enteredAt: paidAt, paidPeriodEnd: paidAt }, pastDuePlan);
    const pastDuePage = await bench.aMandatePage(pastDue, pastDuePlan);
    const onPastDue = await homeOf(pastDue);
    expect(onPastDue.standing).toMatchObject({
      state: 'past_due',
      phase: 'past_due_full_function',
      pausesAt: iso(daysFromNow(METERED_PAUSE_DAY - PAID_DAYS_AGO)),
      graceEndsAt: iso(daysFromNow(PAST_DUE_GRACE_DAYS - PAID_DAYS_AGO)),
    });
    expect(onPastDue).toMatchObject({
      plan: { nextBill: null },
      method: { standing: 'live', manageUrl: pastDuePage },
      due: {
        sale: todaysSale('growth', 'monthly'),
        failedAt: iso(paidAt),
        invoiceNumber: null,
        payUrl: pastDuePage,
      },
      renewal: null,
      refund: null,
      reactivation: null,
      cancellable: false,
    });

    // Halted: the way back is its own plan at today's price; the mandate ended.
    const halted = await bench.aCompany('Surya Halted');
    const haltedPlan = await aPlan(bench.pools.admin.db, 'pro', 'monthly');
    await bench.put(
      halted,
      'halted',
      {
        enteredAt: daysFromNow(-HALTED_DAYS_AGO),
        paidPeriodEnd: daysFromNow(-HALTED_DAYS_AGO - PAST_DUE_GRACE_DAYS),
      },
      haltedPlan,
    );
    await bench.aMandatePage(halted, haltedPlan);
    const onHalted = await homeOf(halted);
    expect(onHalted.standing).toMatchObject({ state: 'halted', phase: 'halted', pausesAt: null });
    expect(onHalted).toMatchObject({
      plan: { nextBill: null },
      method: { standing: 'ended', manageUrl: null },
      due: null,
      refund: null,
      reactivation: {
        tier: 'pro',
        cycle: 'monthly',
        sale: todaysSale('pro', 'monthly'),
        startsAt: null,
      },
      cancellable: false,
    });

    // Expired trial: no plan to reactivate; picking one is the act.
    const expired = await bench.aCompany('Surya Expired', -EXPIRED_DAYS_AGO);
    await bench.put(expired, 'expired', { enteredAt: daysFromNow(-EXPIRED_DAYS_AGO) });
    const onExpired = await homeOf(expired);
    expect(onExpired.standing).toMatchObject({ state: 'expired', phase: 'expired', tier: null });
    expect(onExpired).toMatchObject({
      plan: { listPrice: null, nextBill: null },
      method: { standing: 'none' },
      due: null,
      refund: null,
      reactivation: null,
      cancellable: false,
      includes: { voiceMinutesIncluded: TRIAL_CAPS.meterBundles.voice_minutes },
    });

    // Cancelled, still running: service to the period end, and reactivating carries on from it.
    const cancelled = await bench.aCompany('Surya Cancelled');
    const cancelledPlan = await aPlan(bench.pools.admin.db, 'starter', 'monthly');
    const runsUntil = daysFromNow(CANCELLED_RUNS_DAYS);
    await bench.put(
      cancelled,
      'cancelled',
      { enteredAt: paidAt, paidPeriodEnd: runsUntil },
      cancelledPlan,
    );
    const onCancelled = await homeOf(cancelled);
    expect(onCancelled.standing).toMatchObject({
      state: 'cancelled',
      phase: 'active',
      paidPeriodEnd: iso(runsUntil),
    });
    expect(onCancelled).toMatchObject({
      plan: { nextBill: null },
      method: { standing: 'ended', manageUrl: null },
      due: null,
      refund: null,
      reactivation: {
        tier: 'starter',
        cycle: 'monthly',
        sale: todaysSale('starter', 'monthly'),
        startsAt: iso(runsUntil),
      },
      cancellable: false,
    });
  });

  it('a yearly company’s open renewal invoice is paid on its link', async () => {
    const yearly = await bench.aCompany('Surya Yearly');
    const plan = await aPlan(bench.pools.admin.db, 'growth', 'yearly');
    const periodEnd = daysFromNow(RENEWS_IN_DAYS);
    await bench.put(
      yearly,
      'active',
      { enteredAt: daysFromNow(-PAID_YEAR_DAYS_AGO), paidPeriodEnd: periodEnd },
      plan,
    );
    const link = {
      hostedUrl: 'https://pay.example.test/renewal',
      dueAt: daysFromNow(RENEWS_IN_DAYS + ENTITLEMENT_BUFFER_DAYS),
    };
    const issuedAt = daysFromNow(-PAID_DAYS_AGO);
    const renewal = await bench.anInvoice(yearly, plan, { status: 'issued', issuedAt, link });

    const home = await homeOf(yearly);

    expect(home.standing.collection).toBe('invoice');
    // A link is the yearly company's method: live, with no mandate page to update (frame 24).
    expect(home.method).toEqual({ standing: 'live', label: null, manageUrl: null });
    expect(home.renewal).toEqual({
      invoiceId: renewal.id,
      number: renewal.number,
      sale: todaysSale('growth', 'yearly'),
      dueAt: iso(link.dueAt),
      payUrl: link.hostedUrl,
    });
    expect(home.refund).toBeNull();
  });

  it('a member sees the state and whose act it is, with no amount', async () => {
    const held = await bench.aCompany('Surya Members');
    const plan = await aPlan(bench.pools.admin.db, 'growth', 'monthly');
    const failedAt = daysFromNow(-MEMBER_PAST_DUE_DAYS);
    await bench.put(held, 'past_due', { enteredAt: failedAt, paidPeriodEnd: failedAt }, plan);

    const standing = await bench.get<BillingStanding>('/billing/standing', await held.member());
    const home = await bench.get('/billing/home', await held.member());

    expect(standing.status).toBe(HttpStatus.OK);
    expect(billingStandingSchema.parse(standing.body)).toEqual({
      state: 'past_due',
      phase: 'past_due_metered_paused',
      tier: 'growth',
      cycle: 'monthly',
      collection: 'mandate',
      stateEnteredAt: iso(failedAt),
      trialEndsAt: null,
      pausesAt: iso(daysFromNow(METERED_PAUSE_DAY - MEMBER_PAST_DUE_DAYS)),
      graceEndsAt: iso(daysFromNow(PAST_DUE_GRACE_DAYS - MEMBER_PAST_DUE_DAYS)),
      paidPeriodEnd: iso(failedAt),
    });
    expect(home.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('a past-due row whose grace ran out reads halted before the timer moves it', async () => {
    const held = await bench.aCompany('Surya Late Sweep');
    const plan = await aPlan(bench.pools.admin.db, 'growth', 'monthly');
    const failedAt = daysFromNow(-PAST_DUE_GRACE_DAYS - 1);
    await bench.put(held, 'past_due', { enteredAt: failedAt, paidPeriodEnd: failedAt }, plan);

    const reply = await bench.get<BillingStanding>('/billing/standing', await held.owner());

    expect(reply.body).toMatchObject({
      state: 'halted',
      phase: 'halted',
      stateEnteredAt: iso(daysFromNow(-1)),
      graceEndsAt: null,
    });
  });
});
