import {
  type BillingUsage,
  type BillingUsageSignals,
  billingUsageSchema,
  billingUsageSignalsSchema,
} from '@heliogrid/contracts';
import {
  BILLED_LEDGER_METERS,
  billedQuantityOf,
  MS_PER_DAY,
  type TierLimit,
} from '@heliogrid/domain';
import { minorUnitsToDecimal, overageAddOns } from '@heliogrid/domain/server';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import { MarketPackService } from '../../src/modules/market/market.public';
import { skipWithoutHarness } from '../support/http';
import {
  type HomeBench as Bench,
  daysFromNow,
  HomeBench,
  type HomeCompany,
  iso,
} from './home-bench';
import { aPlan } from './support';
import { UsageBench } from './usage-bench';

const skip = skipWithoutHarness(
  'USAGE SCREEN PROOF',
  'That the usage screen shows the rollups the gates and the invoice read is UNPROVEN in this run.',
);

const MINUTE = 60;
/** The trial's voice cap (`BM-41`) and the minute that reaches 80% of it. */
const TRIAL_VOICE_CAP = 15;
const TRIAL_EIGHTY = 12;
/** Pro's bundle, then ₹6 a minute (`BM-41`), and the minute that reaches 80% of it. */
const PRO_BUNDLE = 400;
const PRO_EIGHTY = 320;
/** Ten minutes and a half past Pro's bundle: ten billed minutes at ₹6. */
const OVER_BUNDLE_SECONDS = 630;
const PAST_PRO_BUNDLE = PRO_BUNDLE * MINUTE + OVER_BUNDLE_SECONDS;
/** A Pro month ten days in, twenty to go. */
const PAID_DAYS_AGO = -10;
const PAID_DAYS_LEFT = 20;
/** The home bench's trial began this many days ago, and ends as many days from now. */
const TRIAL_HALF = 7;
/** The grace a full cap runs before creations pause (`CAP_GRACE_DAYS`). */
const GRACE_DAYS = 7;
/** Two calls the rollup adds up — 9 min 30 s and 50 s — and the minutes they bill. */
const LONG_CALL = 570;
const SHORT_CALL = 50;
/** Gauges in GB: under the trial's 5 GB, at its 80%, and past its tenth of room. */
const SMALL_GAUGE = 2.5;
const EIGHTY_GAUGE = 4;
const OVER_GAUGE = 6;
/** Minutes of a call that fills the trial's cap in two parts, and of calls that leave it clear. */
const FIRST_PART = 10;
const SECOND_PART = 5;
const PAST_TRIAL_CAP = 20;
const A_FEW_MINUTES = 3;

describe.skipIf(skip)('GET /billing/usage and /billing/usage/signals (SCR-M12-04, M12-34)', () => {
  let bench: Bench;
  let usage: UsageBench;

  beforeAll(async () => {
    bench = await HomeBench.open();
    usage = new UsageBench(bench);
  });

  afterAll(async () => {
    await bench?.close();
  });

  async function usageOf(held: HomeCompany): Promise<BillingUsage> {
    const reply = await bench.get<BillingUsage>('/billing/usage', await held.owner());
    expect(reply.status).toBe(HttpStatus.OK);
    return billingUsageSchema.parse(reply.body);
  }

  /** A company on Pro monthly, ten days into its paid month, with Pro's limits. */
  async function aProCompany(name: string) {
    const held = await bench.aCompany(name);
    const plan = await aPlan(bench.pools.admin.db, 'pro', 'monthly');
    const startedAt = daysFromNow(PAID_DAYS_AGO);
    const paidPeriodEnd = daysFromNow(PAID_DAYS_LEFT);
    await bench.put(held, 'active', { enteredAt: startedAt, paidPeriodEnd }, plan);
    await bench.aPayment(held, plan, startedAt, paidPeriodEnd);
    await usage.limits(held, 'pro');
    return { held, startedAt, paidPeriodEnd };
  }

  /** What the company used of every billed meter since `from` — the read the sweep and gates make. */
  async function rollupSince(held: HomeCompany, from: number) {
    return usage.usage.billedRollupOf(held.tenantId, BILLED_LEDGER_METERS, {
      from: new Date(from),
      to: new Date(Date.now() + MS_PER_DAY),
    });
  }

  it('every usage figure is the rollup the gates and the invoice read', async () => {
    const held = await bench.aCompany('Usage Rollup');
    await usage.limits(held, null);
    await usage.call(held, LONG_CALL, daysFromNow(-1));
    await usage.call(held, SHORT_CALL, daysFromNow(-2));
    await usage.gauge(held, SMALL_GAUGE, daysFromNow(-1));

    const body = await usageOf(held);
    const limits = await usage.entitlements.limitsOf(held.tenantId);
    const rollup = await rollupSince(held, daysFromNow(-TRIAL_HALF));
    const gauge = await usage.usage.latestStorageGauge(held.tenantId);

    expect(body.voice.usedMinutes).toBe(
      billedQuantityOf('voice_minutes', rollup.get('voice_minutes') ?? 0),
    );
    expect(body.voice.usedMinutes).toBe(10);
    expect(body.voice.limit).toBe(limits?.get('voice_minutes')?.limit);
    expect(body.storage.usedBytes).toBe(gauge?.gaugeBytes);
    expect(body.storage.limitGb).toBe(limits?.get('storage_gb')?.limit);
    expect(body.proposals.limit).toBe(limits?.get('proposals_per_cycle')?.limit);
    expect(body.activeProjects.limit).toBe(limits?.get('active_projects')?.limit);
    expect(body.designCeilingKw).toBe(limits?.get('design_ceiling_kw')?.limit);
  });

  it('a bundle at 80% reads warning before any gate can fire', async () => {
    const quiet = await bench.aCompany('Usage Quiet');
    await usage.limits(quiet, null);
    await usage.call(quiet, (TRIAL_EIGHTY - 1) * MINUTE, daysFromNow(-1));
    const warned = await bench.aCompany('Usage Warned');
    await usage.limits(warned, null);
    await usage.call(warned, TRIAL_EIGHTY * MINUTE, daysFromNow(-1));
    await usage.gauge(warned, EIGHTY_GAUGE, daysFromNow(-1));

    expect((await usageOf(quiet)).voice.usage.step).toBe('clear');
    const body = await usageOf(warned);
    expect(body.voice.usage).toEqual({ step: 'warning', pausesAt: null, resetsAt: null });
    expect(body.storage.usage.step).toBe('warning');
    // The storage gate has not fired: 4 of the trial's 5 GB still uploads.
    await expect(usage.usage.refuseUploadOverStorage(warned.tenantId)).resolves.toBeUndefined();

    const { held: pro } = await aProCompany('Usage Pro Warned');
    await usage.call(pro, PRO_EIGHTY * MINUTE, daysFromNow(-1));
    expect((await usageOf(pro)).voice.usage.step).toBe('warning');
  });

  it('a full trial cap runs its grace from the moment the ledger reached it', async () => {
    const held = await bench.aCompany('Usage Full');
    await usage.limits(held, null);
    const fullAt = daysFromNow(-2);
    await usage.call(held, FIRST_PART * MINUTE, daysFromNow(-A_FEW_MINUTES));
    await usage.call(held, SECOND_PART * MINUTE, fullAt);

    const body = await usageOf(held);

    expect(body.voice.usage).toEqual({
      step: 'grace',
      pausesAt: iso(fullAt + GRACE_DAYS * MS_PER_DAY),
      resetsAt: null,
    });
    expect(body.voice.limit).toBe(TRIAL_VOICE_CAP);
  });

  it('the cycle and the price list label every figure', async () => {
    const trial = await bench.aCompany('Usage Labels', TRIAL_HALF);
    await usage.limits(trial, null);
    const published = await bench.http.app.get(MarketPackService).currentPublished('IN');

    const trialBody = await usageOf(trial);
    expect(trialBody.cycle.resetsAt).toBe(trialBody.standing.trialEndsAt);
    expect(Date.parse(trialBody.cycle.from)).toBeLessThan(Date.now());
    expect(trialBody.priceListPublishedAt).toBe(published?.publishedAt);
    expect(trialBody.currencyCode).toBe('INR');

    const { held, startedAt, paidPeriodEnd } = await aProCompany('Usage Labels Pro');
    const paid = await usageOf(held);
    expect(paid.cycle).toEqual({ from: iso(startedAt), resetsAt: iso(paidPeriodEnd) });
  });

  it('extra charges so far equal the add-ons the sweep bills', async () => {
    const { held, startedAt, paidPeriodEnd } = await aProCompany('Usage Overage');
    await usage.call(held, PAST_PRO_BUNDLE, daysFromNow(-1));
    const published = await bench.http.app.get(MarketPackService).currentPublished('IN');
    if (published === null) throw new Error('the IN pack is not published');
    const limits = await usage.entitlements.limitsOf(held.tenantId);
    const allowances = new Map<'voice_minutes', TierLimit>([
      ['voice_minutes', limits?.get('voice_minutes')?.limit ?? 0],
    ]);
    const [addOn] = overageAddOns(
      published.pack.priceBook,
      allowances,
      await rollupSince(held, startedAt),
    );
    if (addOn === undefined) throw new Error('the sweep reckons no add-on');
    const owed = minorUnitsToDecimal(addOn.amount, published.pack.formats.minorUnitDigits);

    const body = await usageOf(held);

    expect(owed).toBe('60.00');
    expect(body.voice.soFar).toBe(owed);
    expect(body.voice.rate).toBe('6.00');
    expect(body.voice.usage.step).toBe('overage');
    expect(body.standing.collection).toBe('mandate');
    // A mandate's debit at the period's end has gone before the month is reckoned: the next one.
    expect(body.extraCharges).toEqual({
      total: owed,
      billsOn: iso(cycleEnd(paidPeriodEnd, 'monthly')),
    });
  });

  it('a company that is not active shows no extra charges, since none will be collected', async () => {
    const { held, startedAt, paidPeriodEnd } = await aProCompany('Usage Past Due');
    await usage.call(held, PAST_PRO_BUNDLE, daysFromNow(-1));
    const plan = await aPlan(bench.pools.admin.db, 'pro', 'monthly');
    await bench.put(held, 'past_due', { enteredAt: daysFromNow(-1), paidPeriodEnd }, plan);
    await bench.aPayment(held, plan, startedAt, paidPeriodEnd);

    const body = await usageOf(held);

    expect(body.voice.soFar).toBeNull();
    expect(body.extraCharges).toBeNull();
  });

  it('an unbilled call moves no figure, no step and no event', async () => {
    const held = await bench.aCompany('Usage Unbilled');
    await usage.limits(held, null);
    await usage.call(held, PAST_TRIAL_CAP * MINUTE, daysFromNow(-2), false);
    await usage.call(held, (TRIAL_EIGHTY - 1) * MINUTE, daysFromNow(-1));

    const body = await usageOf(held);
    const events = await bench.get<{ totalCount: number }>(
      '/billing/usage/events?meter=voice_minutes',
      await held.owner(),
    );

    expect(body.voice.usedMinutes).toBe(TRIAL_EIGHTY - 1);
    expect(body.voice.usage.step).toBe('clear');
    expect(events.body.totalCount).toBe(1);
  });

  it('use after the paid period ends is no part of the period it ended', async () => {
    const held = await bench.aCompany('Usage Buffer');
    const plan = await aPlan(bench.pools.admin.db, 'pro', 'monthly');
    const startedAt = daysFromNow(PAID_DAYS_AGO - PAID_DAYS_LEFT);
    const paidPeriodEnd = daysFromNow(-2);
    await bench.put(held, 'active', { enteredAt: startedAt, paidPeriodEnd }, plan);
    await bench.aPayment(held, plan, startedAt, paidPeriodEnd);
    await usage.limits(held, 'pro');
    await usage.call(held, A_FEW_MINUTES * MINUTE, daysFromNow(-A_FEW_MINUTES));
    await usage.call(held, PAST_PRO_BUNDLE, daysFromNow(-1));

    const body = await usageOf(held);

    expect(body.voice.usedMinutes).toBe(A_FEW_MINUTES);
    expect(body.voice.soFar).toBeNull();
  });

  it('a trial shows no rate, no extra charges and no bill date', async () => {
    const held = await bench.aCompany('Usage Trial Free');
    await usage.limits(held, null);
    await usage.call(held, PAST_TRIAL_CAP * MINUTE, daysFromNow(-1));

    const body = await usageOf(held);

    expect(body.voice).toMatchObject({ rate: null, soFar: null });
    expect(body.extraCharges).toBeNull();
  });

  it('a person who is not the Owner reads no usage figure', async () => {
    const held = await bench.aCompany('Usage Member');
    await usage.limits(held, null);
    await usage.gauge(held, OVER_GAUGE, daysFromNow(-1));
    await usage.call(held, A_FEW_MINUTES * MINUTE, daysFromNow(-1));

    const figures = await bench.get('/billing/usage', await held.member());
    const events = await bench.get(
      '/billing/usage/events?meter=voice_minutes',
      await held.member(),
    );
    const reply = await bench.get<BillingUsageSignals>(
      '/billing/usage/signals',
      await held.member(),
    );

    expect(figures.status).toBe(HttpStatus.FORBIDDEN);
    expect(events.status).toBe(HttpStatus.FORBIDDEN);
    expect(reply.status).toBe(HttpStatus.OK);
    // 6 GB past the trial's 5 GB and its tenth: uploads pause, named with no figure.
    expect(billingUsageSignalsSchema.parse(reply.body)).toEqual({
      signals: [{ meter: 'storage', usage: { step: 'paused', pausesAt: null, resetsAt: null } }],
    });
  });
});
