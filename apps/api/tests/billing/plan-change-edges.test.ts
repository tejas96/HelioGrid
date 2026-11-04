import { subscription } from '@heliogrid/db';
import { IN_PACK, listedPrice, MS_PER_DAY, minorUnits } from '@heliogrid/domain';
import { dayRate, minorUnitsToDecimal } from '@heliogrid/domain/server';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness, NOT_BILLING } from './conversion-harness';
import { midCycle, PlanScreen } from './plan-change-bench';

/**
 * The plan screen's refusals and repeats (`M12-48`, `M12-49`, `M12-12`, `M12-56`): a review the
 * usage moved past, a row that is not `active`, a plan not sold, a gateway that does not answer,
 * a second press, a withdraw, a replacement, and another company's usage never read.
 */

const skip = skipWithoutDatabase(
  'PLAN CHANGE EDGES PROOF',
  'The plan change’s refusals and repeats are UNPROVEN in this run.',
);

const TODAY = new Date().toISOString().slice(0, 10);
const OVER_STARTER_GB = 12;
const starter = { tier: 'starter', cycle: 'monthly' } as const;
/** How far into its paid year a yearly company switches. */
const DAYS_INTO_YEAR = 40;
const growthYearly = { tier: 'growth', cycle: 'yearly' } as const;

describe.skipIf(skip)('the plan change at its edges', () => {
  let harness: ConversionHarness;
  let screen: PlanScreen;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
    screen = new PlanScreen(harness);
  });

  afterAll(async () => {
    await harness.close();
  });

  it('a person who is not the Owner reads no review and changes nothing', async () => {
    const owner = await midCycle(harness, 'Not The Owner EPC');
    const member = await harness.aMemberOf(owner, NOT_BILLING);
    const preview = await harness.http.call(
      'GET',
      '/billing/plan-change/preview?tier=starter&cycle=monthly',
      undefined,
      await member(),
    );
    expect(preview.status).toBe(HttpStatus.FORBIDDEN);
    const change = await harness.http.call(
      'POST',
      '/billing/plan-change',
      { ...starter, previewDigest: 'any' },
      await member(),
    );
    expect(change.status).toBe(HttpStatus.FORBIDDEN);
    const withdraw = await harness.http.call(
      'POST',
      '/billing/plan-change/withdraw',
      {},
      await member(),
    );
    expect(withdraw.status).toBe(HttpStatus.FORBIDDEN);
    expect(await screen.changesOf(owner.subscriptionId)).toEqual([]);
  });

  it('a confirm on a review the usage moved past is refused and schedules nothing', async () => {
    const owner = await midCycle(harness, 'Moved Usage EPC');
    const preview = await screen.preview(owner, starter);
    expect(preview.body.blocks).toEqual([]);
    await screen.aGauge(owner.company.tenantId, OVER_STARTER_GB, TODAY);

    const reply = await screen.change(owner, { ...starter, previewDigest: preview.body.digest });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('PLAN_CHANGE_PREVIEW_CHANGED');
    expect(await screen.changesOf(owner.subscriptionId)).toEqual([]);
    expect(harness.gateway.endsAtCycleEnd(owner.gatewayRef)).toBe(false);
  });

  it('a confirm on a review the paid period moved past is refused and opens nothing', async () => {
    const owner = await midCycle(harness, 'Moved Period EPC');
    const pro = { tier: 'pro', cycle: 'monthly' } as const;
    const preview = await screen.preview(owner, pro);
    // A renewal landed between the review and the confirm: the period, and the charge, moved.
    await harness.pools.admin.db
      .update(subscription)
      .set({ paidPeriodEnd: new Date(owner.paidPeriodEnd + MS_PER_DAY) })
      .where(eq(subscription.id, owner.subscriptionId));

    const reply = await screen.change(owner, { ...pro, previewDigest: preview.body.digest });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('PLAN_CHANGE_PREVIEW_CHANGED');
    expect((await harness.checkoutsOf(owner.subscriptionId)).open).toEqual([]);
  });

  it('a past-due company changes nothing until it pays', async () => {
    const owner = await midCycle(harness, 'Past Due EPC');
    const preview = await screen.preview(owner, starter);
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'past_due', stateEnteredAt: new Date() })
      .where(eq(subscription.id, owner.subscriptionId));
    const reply = await screen.change(owner, { ...starter, previewDigest: preview.body.digest });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('PLAN_CHANGE_NOT_POSSIBLE');
    expect(await screen.changesOf(owner.subscriptionId)).toEqual([]);
  });

  it('the plan already held is no change to review or confirm', async () => {
    const owner = await midCycle(harness, 'Same Plan EPC');
    const held = { tier: 'growth', cycle: 'monthly' } as const;
    const preview = await screen.preview(owner, held);
    expect(preview.status).toBe(HttpStatus.CONFLICT);
    expect(preview.body.error?.code).toBe('PLAN_CHANGE_NOT_POSSIBLE');
    const reply = await screen.change(owner, { ...held, previewDigest: 'any' });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('PLAN_CHANGE_NOT_POSSIBLE');
    expect(await screen.changesOf(owner.subscriptionId)).toEqual([]);
  });

  it('Enterprise is never a change: no price, so not sold', async () => {
    const owner = await midCycle(harness, 'Enterprise Pick EPC');
    const enterprise = { tier: 'enterprise', cycle: 'monthly' } as const;
    const preview = await screen.preview(owner, enterprise);
    expect(preview.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(preview.body.error?.code).toBe('TIER_NOT_SOLD');
    const reply = await screen.change(owner, { ...enterprise, previewDigest: 'any' });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body.error?.code).toBe('TIER_NOT_SOLD');
  });

  it('a gateway that does not answer the mandate’s end schedules nothing', async () => {
    const owner = await midCycle(harness, 'Mandate Gateway Down EPC');
    const preview = await screen.preview(owner, starter);
    const original = harness.gateway.cancelAtCycleEnd.bind(harness.gateway);
    harness.gateway.cancelAtCycleEnd = () => Promise.reject(new Error('the gateway is down'));
    try {
      const reply = await screen.change(owner, { ...starter, previewDigest: preview.body.digest });
      expect(reply.status).toBe(HttpStatus.BAD_GATEWAY);
      expect(reply.body.error?.code).toBe('GATEWAY_UNAVAILABLE');
    } finally {
      harness.gateway.cancelAtCycleEnd = original;
    }
    expect(await screen.changesOf(owner.subscriptionId)).toEqual([]);
    expect((await harness.subscriptionOf(owner.subscriptionId))?.mandateEndingAt).toBeNull();
  });

  it('a second press schedules once, tells the mandate once, and audits once', async () => {
    const owner = await midCycle(harness, 'Double Press EPC');
    let told = 0;
    const original = harness.gateway.cancelAtCycleEnd.bind(harness.gateway);
    harness.gateway.cancelAtCycleEnd = (ref) => {
      told += 1;
      return original(ref);
    };
    try {
      const first = await screen.confirm(owner, starter);
      const second = await screen.confirm(owner, starter);
      expect(second.body).toEqual(first.body);
      // A different pick replaces the scheduled one; the mandate is already ending.
      const replaced = await screen.confirm(owner, growthYearly);
      expect(replaced.body.outcome).toBe('scheduled');
    } finally {
      harness.gateway.cancelAtCycleEnd = original;
    }
    expect(told).toBe(1);
    const changes = await screen.changesOf(owner.subscriptionId);
    expect(changes.map((row) => [row.kind, row.status])).toEqual([
      ['downgrade', 'replaced'],
      ['cycle_switch', 'scheduled'],
    ]);
    const scheduled = (await harness.auditOf(owner.company.tenantId)).filter(
      (entry) => entry.eventType === 'billing.plan_change_scheduled',
    );
    expect(scheduled).toHaveLength(2);
  });

  it('Keep the plan instead withdraws the scheduled change once, and the plan stays', async () => {
    const owner = await midCycle(harness, 'Withdraw EPC');
    expect((await screen.confirm(owner, starter)).status).toBe(HttpStatus.OK);
    expect((await screen.withdraw(owner)).body).toEqual({ withdrawn: true });
    expect((await screen.withdraw(owner)).body).toEqual({ withdrawn: false });
    expect((await screen.changesOf(owner.subscriptionId)).map((row) => row.status)).toEqual([
      'withdrawn',
    ]);
    const home = await screen.home(owner);
    expect(home.body.scheduledChange).toBeNull();
    expect((await harness.subscriptionOf(owner.subscriptionId))?.tier).toBe('growth');
  });

  it('a monthly to yearly switch on the same plan costs nothing today and waits for the cycle’s end', async () => {
    const owner = await midCycle(harness, 'Cycle Switch EPC');
    // A year's days are counted from this period's start, as the review counts them: 365, or 366
    // when the year holds a 29 February (the board's 365 gives ₹109.56 a day).
    const yearDays = Math.round((cycleEnd(owner.paidAt, 'yearly') - owner.paidAt) / MS_PER_DAY);
    const growthYear = listedPrice(IN_PACK.priceBook, 'growth', 'yearly') ?? minorUnits(0);
    const preview = await screen.preview(owner, growthYearly);
    expect(preview.body).toMatchObject({
      kind: 'cycle_switch',
      // The board's review: part of this cycle, 16 of 30 days, ₹0, with its working.
      today: {
        sale: { list: '0.00', total: '0.00' },
        partCycle: {
          daysLeft: 16,
          daysInCycle: 30,
          toCycleDays: yearDays,
          difference: null,
          fromDayRate: '133.30',
          toDayRate: minorUnitsToDecimal(
            dayRate({ price: growthYear, days: yearDays }),
            IN_PACK.formats.minorUnitDigits,
          ),
        },
      },
      blocks: null,
      startsAt: new Date(owner.paidPeriodEnd).toISOString(),
    });
    expect(preview.body.afterwards.list).toBe('39990.00');
    const reply = await screen.change(owner, {
      ...growthYearly,
      previewDigest: preview.body.digest,
    });
    expect(reply.body).toEqual({
      outcome: 'scheduled',
      effectiveAt: new Date(owner.paidPeriodEnd).toISOString(),
    });
    expect((await screen.home(owner)).body.scheduledChange).toMatchObject({
      kind: 'cycle_switch',
      cycle: 'yearly',
    });
  });

  it('a yearly to monthly switch on the same plan owes nothing today, whatever the day rates', async () => {
    const paidAt = Date.now() - DAYS_INTO_YEAR * MS_PER_DAY;
    const yearDays = Math.round((cycleEnd(paidAt, 'yearly') - paidAt) / MS_PER_DAY);
    const owner = await harness.aPaidOwner('Yearly Switch EPC', {
      tier: 'growth',
      cycle: 'yearly',
      paidAt,
      periodDays: yearDays,
    });
    const growthMonthly = { tier: 'growth', cycle: 'monthly' } as const;
    const preview = await screen.preview(owner, growthMonthly);
    expect(preview.body).toMatchObject({
      kind: 'cycle_switch',
      today: {
        sale: { list: '0.00', total: '0.00' },
        partCycle: { daysInCycle: yearDays, difference: null, fromDayRate: '109.56' },
      },
    });
    const reply = await screen.change(owner, {
      ...growthMonthly,
      previewDigest: preview.body.digest,
    });
    expect(reply.body.outcome).toBe('scheduled');
  });

  it('one company’s preview never reads another company’s usage, and its withdraw never touches it', async () => {
    const over = await midCycle(harness, 'Over Storage EPC');
    const other = await midCycle(harness, 'Under Storage EPC');
    await screen.aGauge(over.company.tenantId, OVER_STARTER_GB, TODAY);
    expect((await screen.confirm(over, starter)).status).toBe(HttpStatus.OK);

    expect((await screen.preview(other, starter)).body.blocks).toEqual([]);
    expect((await screen.withdraw(other)).body).toEqual({ withdrawn: false });
    expect((await screen.changesOf(over.subscriptionId)).map((row) => row.status)).toEqual([
      'scheduled',
    ]);
  });
});
