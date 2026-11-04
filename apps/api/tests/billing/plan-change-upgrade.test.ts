import { invoiceLine, subscription } from '@heliogrid/db';
import { IN_PACK, MS_PER_DAY, minorUnits } from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness, chargeRefOf } from './conversion-harness';
import { midCycle, PlanScreen } from './plan-change-bench';

/**
 * An upgrade over HTTP (`M12-48`): the review works out the part of this cycle left, the provider's
 * payment link collects it, and the charge that pays it moves the row wholly onto the higher plan
 * — its limits live at once, one `proration` invoice, the old mandate told to end at its cycle.
 */

const skip = skipWithoutDatabase(
  'PLAN UPGRADE PROOF',
  'An upgrade’s part-cycle charge and the limits it makes live are UNPROVEN in this run.',
);

/** The board's figure: Growth → Pro with 16 of 30 days left (`T-M12-003` decision 3). */
const SAMPLE_CHARGE_MINOR = 320_000;
const SAMPLE_CHARGE = minorUnits(SAMPLE_CHARGE_MINOR);
const SAMPLE_DAYS_LEFT = 16;
const PRO_STORAGE_GB = 250;
const GROWTH_STORAGE_GB = 50;

describe.skipIf(skip)('an upgrade mid-cycle (M12-48)', () => {
  let harness: ConversionHarness;
  let screen: PlanScreen;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
    screen = new PlanScreen(harness);
  });

  afterAll(async () => {
    await harness.close();
  });

  const pro = { tier: 'pro', cycle: 'monthly' } as const;

  it("an upgrade's paid part-cycle charge makes the higher limits live at once and issues one prorated invoice", async () => {
    const owner = await midCycle(harness, 'Upgrade EPC', SAMPLE_DAYS_LEFT);
    expect(await screen.limitOf(owner.company.tenantId, 'storage_gb')).toBe(GROWTH_STORAGE_GB);

    const preview = await screen.preview(owner, { tier: 'pro', cycle: 'monthly' });
    expect(preview.status).toBe(HttpStatus.OK);
    expect(preview.body).toMatchObject({
      kind: 'upgrade',
      from: { tier: 'growth', cycle: 'monthly' },
      to: { tier: 'pro', cycle: 'monthly' },
      today: {
        sale: { list: '3200.00', total: '3200.00' },
        partCycle: {
          daysLeft: SAMPLE_DAYS_LEFT,
          daysInCycle: 30,
          toCycleDays: 30,
          fromPrice: '3999.00',
          toPrice: '9999.00',
          difference: '6000.00',
          fromDayRate: '133.30',
          toDayRate: '333.30',
        },
      },
      startsAt: new Date(owner.paidPeriodEnd).toISOString(),
      blocks: null,
    });

    const changed = await screen.change(owner, {
      tier: 'pro',
      cycle: 'monthly',
      previewDigest: preview.body.digest,
    });
    expect(changed.status).toBe(HttpStatus.OK);
    expect(changed.body.outcome).toBe('page');
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    expect(page).toMatchObject({ purpose: 'plan_change', collection: 'invoice' });
    expect(page.chargeMinor).toBe(SAMPLE_CHARGE);
    expect(page.expiresAt.getTime()).toBe(owner.paidPeriodEnd);
    // Nothing moves until the page is paid.
    expect((await harness.subscriptionOf(owner.subscriptionId))?.tier).toBe('growth');

    const paidAt = Date.now();
    const told = await harness.tellPaid(
      page.gatewayRef,
      paidAt,
      null,
      platformSaleTotal(IN_PACK, SAMPLE_CHARGE),
    );
    expect(told.status).toBe(HttpStatus.OK);

    const moved = await harness.subscriptionOf(owner.subscriptionId);
    expect(moved).toMatchObject({ tier: 'pro', cycle: 'monthly', collection: 'mandate' });
    expect(moved?.paidPeriodEnd?.getTime()).toBe(owner.paidPeriodEnd);
    expect(await screen.limitOf(owner.company.tenantId, 'storage_gb')).toBe(PRO_STORAGE_GB);
    // The old mandate debits its old amount no more (`M12-57`).
    expect(harness.gateway.endsAtCycleEnd(owner.gatewayRef)).toBe(true);
    expect(moved?.mandateEndingAt).not.toBeNull();

    const prorations = (await harness.invoicesOf(owner.company.tenantId)).filter(
      (invoice) => invoice.kind === 'proration',
    );
    expect(prorations).toHaveLength(1);
    const [proration] = prorations;
    const lines = await harness.pools.admin.db
      .select()
      .from(invoiceLine)
      .where(eq(invoiceLine.invoiceId, proration?.id ?? ''));
    expect(lines.map((line) => [line.planPriceId, line.taxableMinor])).toEqual([
      [page.planPriceId, SAMPLE_CHARGE],
    ]);
    expect(proration).toMatchObject({ status: 'paid' });
    expect((await harness.checkoutsOf(owner.subscriptionId)).open).toEqual([]);
    const audit = await harness.auditOf(owner.company.tenantId);
    expect(audit.filter((entry) => entry.eventType === 'billing.plan_changed')).toHaveLength(1);

    // The same message again moves nothing twice.
    await harness.tellPaid(
      page.gatewayRef,
      paidAt,
      null,
      platformSaleTotal(IN_PACK, SAMPLE_CHARGE),
    );
    expect(
      (await harness.invoicesOf(owner.company.tenantId)).filter(
        (each) => each.kind === 'proration',
      ),
    ).toHaveLength(1);
  });

  it('a second press on the same upgrade answers the same page and opens no other', async () => {
    const owner = await midCycle(harness, 'Double Upgrade EPC');
    const first = await screen.confirm(owner, { tier: 'pro', cycle: 'monthly' });
    const second = await screen.confirm(owner, { tier: 'pro', cycle: 'monthly' });
    expect(second.body).toEqual(first.body);
    const pages = await harness.checkoutsOf(owner.subscriptionId);
    expect(pages.all.filter((row) => row.purpose === 'plan_change')).toHaveLength(1);
  });

  it('a downgrade confirmed while an upgrade page is open closes that page', async () => {
    const owner = await midCycle(harness, 'Page Then Downgrade EPC');
    expect((await screen.confirm(owner, pro)).body.outcome).toBe('page');
    const page = await harness.openCheckoutOf(owner.subscriptionId);

    expect((await screen.confirm(owner, { tier: 'starter', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    expect((await harness.checkoutsOf(owner.subscriptionId)).open).toEqual([]);
    expect(harness.gateway.wasClosed(page.gatewayRef)).toBe(true);
  });

  it('an upgrade owing nothing today closes the page an earlier upgrade left open', async () => {
    const owner = await midCycle(harness, 'Page Then Free Upgrade EPC', 2);
    expect((await screen.confirm(owner, pro)).body.outcome).toBe('page');
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    // The period runs out today: no day is left to charge for.
    await harness.pools.admin.db
      .update(subscription)
      .set({ paidPeriodEnd: new Date() })
      .where(eq(subscription.id, owner.subscriptionId));

    expect((await screen.confirm(owner, pro)).body.outcome).toBe('applied');
    expect((await harness.checkoutsOf(owner.subscriptionId)).open).toEqual([]);
    expect(harness.gateway.wasClosed(page.gatewayRef)).toBe(true);
  });

  it('an upgrade page paid after the row moved off the period it was priced on moves nothing and is paid back', async () => {
    const owner = await midCycle(harness, 'Moved Before Paid EPC');
    expect((await screen.confirm(owner, pro)).body.outcome).toBe('page');
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    // A renewal moved the period between the page opening and its payment.
    await harness.pools.admin.db
      .update(subscription)
      .set({ paidPeriodEnd: new Date(owner.paidPeriodEnd + MS_PER_DAY) })
      .where(eq(subscription.id, owner.subscriptionId));

    const paidAt = Date.now();
    const amount = platformSaleTotal(IN_PACK, minorUnits(page.chargeMinor ?? 0));
    expect((await harness.tellPaid(page.gatewayRef, paidAt, null, amount)).status).toBe(
      HttpStatus.OK,
    );

    expect((await harness.subscriptionOf(owner.subscriptionId))?.tier).toBe('growth');
    expect(
      (await harness.invoicesOf(owner.company.tenantId)).filter(
        (each) => each.kind === 'proration',
      ),
    ).toEqual([]);
    const chargeRef = chargeRefOf(page.gatewayRef, paidAt);
    expect(harness.gateway.refundOf(chargeRef)).toMatchObject({ chargeRef, amount });
  });

  it('a gateway that does not answer is a 502 and opens nothing', async () => {
    const owner = await midCycle(harness, 'Gateway Down EPC');
    const preview = await screen.preview(owner, { tier: 'pro', cycle: 'monthly' });
    const original = harness.gateway.openCheckout.bind(harness.gateway);
    harness.gateway.openCheckout = () => Promise.reject(new Error('the gateway is down'));
    try {
      const reply = await screen.change(owner, {
        tier: 'pro',
        cycle: 'monthly',
        previewDigest: preview.body.digest,
      });
      expect(reply.status).toBe(HttpStatus.BAD_GATEWAY);
      expect(reply.body.error?.code).toBe('GATEWAY_UNAVAILABLE');
    } finally {
      harness.gateway.openCheckout = original;
    }
    expect((await harness.checkoutsOf(owner.subscriptionId)).open).toEqual([]);
    expect((await harness.subscriptionOf(owner.subscriptionId))?.tier).toBe('growth');
  });
});
