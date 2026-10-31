import type { AddedToNextCharge, GatewayAddOnRequest } from '@heliogrid/contracts';
import { billingCheckout, subscription } from '@heliogrid/db';
import { ADD_ON_LEAD_DAYS, IN_PACK, MS_PER_DAY } from '@heliogrid/domain';
import { eq, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { OverageAdminRepository } from '../../src/modules/billing/overage.admin.repository';
import { type Company, openPools, skipWithoutDatabase, unseed } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { publishIndiaPack } from '../support/market';
import { addOnsOf, aMandate, type Mandate, overageSweep, timeline, use } from './overage-bench';
import { RecordedAlerts, silentLogger } from './support';

/**
 * The overage sweep at the gateway's edge (`M12-35`): an add-on the gateway refused waits for the
 * next run, one it did not answer is never sent blind again, two runs never both fit one mandate's
 * cap, and a subscription now collected by payment link is left to that link.
 */

/** A year no other suite charges in, so the periods the sweep finds are this suite's. */
const SUITE_YEAR = 1975;
const PERIODS = timeline(SUITE_YEAR);
const { MID_MAY, MAY_SETTLED } = PERIODS;

const skip = skipWithoutDatabase(
  'OVERAGE GATEWAY PROOF',
  'An overage add-on is sent once, and the mandate cap holds across runs: UNPROVEN in this run.',
);

const SECONDS_PER_MINUTE = 60;
const STARTER_DETECTIONS =
  IN_PACK.priceBook.tiers.starter?.capacity.meterBundles.ai_roof_detections;
/** Starter's ₹1,999 plan with 2,000 minutes (₹12,000) fits the ₹15,000 UPI cap; 200 detections more do not. */
const MINUTES_THAT_FIT = 2_000;
const DETECTIONS_THAT_WAIT = 200;
/** One minute past a bundle of 0: ₹6, an add-on that fits any debit. */
const ONE_MINUTE = SECONDS_PER_MINUTE;

/** A gateway that answers each add-on as told, and counts what it was sent. */
class ScriptedGateway extends DevelopmentBillingGateway {
  sent = 0;

  constructor(private readonly answer: () => Promise<AddedToNextCharge>) {
    super(silentLogger());
  }

  override async addToNextCharge(request: GatewayAddOnRequest): Promise<AddedToNextCharge> {
    this.sent += 1;
    const answer = await this.answer();
    return answer.kind === 'added' ? super.addToNextCharge(request) : answer;
  }
}

describe.skipIf(skip)('overage add-ons at the gateway (M12-35)', () => {
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

  /** A Starter mandate one voice minute over its May bundle. */
  async function aMinuteOver(): Promise<Mandate> {
    const mandate = await aMandate(pools, companies, 'starter', PERIODS);
    await use(pools, mandate, 'voice_minutes', ONE_MINUTE, MID_MAY);
    return mandate;
  }

  it('an add-on the gateway refused waits for the next run, and one it did not answer is never sent again', async () => {
    const refusedThenAdded = await aMinuteOver();
    let refuse = true;
    const choosy = new ScriptedGateway(async () =>
      refuse ? { kind: 'refused' } : { kind: 'added', gatewayAddOnRef: 'unused' },
    );
    await overageSweep(pools, choosy, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED);
    expect((await addOnsOf(pools, refusedThenAdded)).map((row) => row.status)).toEqual(['pending']);
    refuse = false;
    await overageSweep(pools, choosy, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED);
    expect((await addOnsOf(pools, refusedThenAdded)).map((row) => row.status)).toEqual(['added']);

    const unanswered = await aMinuteOver();
    const silent = new ScriptedGateway(async () => {
      throw new Error('The operation was aborted due to timeout');
    });
    const alerts = new RecordedAlerts(silentLogger());
    await overageSweep(pools, silent, alerts).addDue(MAY_SETTLED);
    await overageSweep(pools, silent, alerts).addDue(MAY_SETTLED);

    expect(silent.sent).toBe(1);
    expect((await addOnsOf(pools, unanswered)).map((row) => row.status)).toEqual(['adding']);
    expect(alerts.raised.map(([alert]) => alert)).toEqual(['billing_overage_unsure']);
  });

  it('a row that waited or was refused goes behind every row not yet tried, and a refusal that repeats is alerted', async () => {
    // Waited: the voice add-on is added, and the detections wait beside it under the cap.
    const waits = await aMandate(pools, companies, 'starter', PERIODS);
    await use(pools, waits, 'voice_minutes', MINUTES_THAT_FIT * SECONDS_PER_MINUTE, MID_MAY);
    const detections = Number(STARTER_DETECTIONS) + DETECTIONS_THAT_WAIT;
    await use(pools, waits, 'ai_roof_detections', detections, MID_MAY);
    const adding = new ScriptedGateway(async () => ({ kind: 'added', gatewayAddOnRef: 'unused' }));
    await overageSweep(pools, adding, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED);
    expect((await addOnsOf(pools, waits)).map(({ status }) => status)).toEqual([
      'added',
      'pending',
    ]);

    // A company reckoned a day later, never tried: it comes first, though reckoned last.
    const later = await aMinuteOver();
    await stateOf(later, 'past_due');
    const reckonedLater = MAY_SETTLED + MS_PER_DAY;
    await overageSweep(pools, adding, new RecordedAlerts(silentLogger())).addDue(reckonedLater);
    await stateOf(later, 'active');
    const queue = new OverageAdminRepository(pools.admin.db);
    const lead = ADD_ON_LEAD_DAYS * MS_PER_DAY;
    const [first] = await queue.waiting(reckonedLater, lead, 1);
    expect(first?.subscriptionId).toBe(later.subscriptionId);

    // Refused: logged the first time, alerted when it repeats; either way it goes behind.
    const refusing = new ScriptedGateway(async () => ({ kind: 'refused' }));
    const alerts = new RecordedAlerts(silentLogger());
    const alertedFor = () =>
      alerts.raised.filter(([, facts]) => facts.subscriptionId === later.subscriptionId);
    await overageSweep(pools, refusing, alerts).addDue(reckonedLater);
    expect(alertedFor()).toEqual([]);
    await overageSweep(pools, refusing, alerts).addDue(reckonedLater);
    expect(alertedFor().map(([alert]) => alert)).toEqual(['billing_overage_refused']);
  });

  it('two runs adding to one mandate at once never both fit under its cap', async () => {
    const mandate = await aMandate(pools, companies, 'starter', PERIODS);
    await use(pools, mandate, 'voice_minutes', MINUTES_THAT_FIT * SECONDS_PER_MINUTE, MID_MAY);
    const detections = Number(STARTER_DETECTIONS) + DETECTIONS_THAT_WAIT;
    await use(pools, mandate, 'ai_roof_detections', detections, MID_MAY);
    // Reckoned while past due, so neither add-on is added yet.
    await stateOf(mandate, 'past_due');
    const gateway = new ScriptedGateway(async () => ({ kind: 'added', gatewayAddOnRef: 'unused' }));
    await overageSweep(pools, gateway, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED);
    await stateOf(mandate, 'active');

    const held = await holdLock(
      sql`select pg_advisory_xact_lock(hashtext(${`overage:${mandate.gatewayRef}`}))`,
    );
    // Each run on pools of its own, as two api processes would be: one connection each.
    const apart = [openPools(), openPools()];
    const runs = apart.map((own) =>
      overageSweep(own, gateway, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED),
    );
    await held.waitForWaiters(2);
    await held.release();
    await Promise.all(runs);
    await Promise.all(apart.map((own) => own.close()));

    expect((await addOnsOf(pools, mandate)).map(({ meter, status }) => [meter, status])).toEqual([
      ['voice_minutes', 'added'],
      ['ai_roof_detections', 'pending'],
    ]);
    expect(gateway.sent).toBe(1);
  });

  it('an add-on of a subscription now collected by payment link is left for that link', async () => {
    const mandate = await aMinuteOver();
    await stateOf(mandate, 'past_due');
    const gateway = new ScriptedGateway(async () => ({ kind: 'added', gatewayAddOnRef: 'unused' }));
    await overageSweep(pools, gateway, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED);
    await stateOf(mandate, 'active');
    // A re-pick moved the company onto a yearly payment link.
    await pools.admin.db
      .update(billingCheckout)
      .set({ collection: 'invoice' })
      .where(eq(billingCheckout.gatewayRef, mandate.gatewayRef));

    expect(
      await overageSweep(pools, gateway, new RecordedAlerts(silentLogger())).addDue(MAY_SETTLED),
    ).toEqual({
      reckoned: 0,
      added: 0,
    });
    expect(gateway.sent).toBe(0);
    expect((await addOnsOf(pools, mandate)).map((row) => row.status)).toEqual(['pending']);
  });

  async function stateOf(mandate: Mandate, state: 'active' | 'past_due'): Promise<void> {
    await pools.admin.db
      .update(subscription)
      .set({ state })
      .where(eq(subscription.id, mandate.subscriptionId));
  }
});
