import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness } from './conversion-harness';
import { PlanScreen } from './plan-change-bench';
import { collectedFor } from './support';

/**
 * A trial converting from the plan screen (`M12-54`, `M12-11`): its review is the first whole
 * cycle, it pays through checkout on the rail the pack's ladder names, and the charge makes its
 * plan, rail and limits the row's own. The change route refuses a trial: it has no plan to change.
 */

const skip = skipWithoutDatabase(
  'PLAN SCREEN CONVERSION PROOF',
  'A trial’s conversion from the plan screen is UNPROVEN in this run.',
);

const GROWTH_STORAGE_GB = 50;
const A_MINUTE = 60_000;

describe.skipIf(skip)('a trial converts from the plan screen (M12-54)', () => {
  let harness: ConversionHarness;
  let screen: PlanScreen;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
    screen = new PlanScreen(harness);
  });

  afterAll(async () => {
    await harness.close();
  });

  it("a trial converted from the plans screen rides the pack's rail and holds its plan's limits on payment", async () => {
    const owner = await harness.anOwnerOnATrial('Plan Screen Trial EPC');
    const pick = { tier: 'growth', cycle: 'yearly' } as const;

    const before = Date.now();
    const preview = await screen.preview(owner, pick);
    expect(preview.status).toBe(HttpStatus.OK);
    expect(preview.body).toMatchObject({
      kind: 'conversion',
      from: null,
      to: pick,
      today: { sale: { list: '39990.00' }, partCycle: null },
      blocks: null,
    });
    expect(preview.body.afterwards.list).toBe('39990.00');
    const startsAt = Date.parse(preview.body.startsAt);
    expect(startsAt).toBeGreaterThanOrEqual(before);
    expect(Date.parse(preview.body.nextBillAt)).toBe(cycleEnd(startsAt, 'yearly'));

    // A trial has no plan to change: the screen sends it to checkout.
    const refused = await screen.change(owner, { ...pick, previewDigest: preview.body.digest });
    expect(refused.status).toBe(HttpStatus.CONFLICT);
    expect(refused.body.error?.code).toBe('PLAN_CHANGE_NOT_POSSIBLE');

    expect((await harness.checkout(owner, pick)).status).toBe(HttpStatus.OK);
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    expect(page).toMatchObject({ collection: 'invoice', purpose: 'conversion', chargeMinor: null });

    const paidAt = Date.now() - A_MINUTE;
    const told = await harness.tellPaid(
      page.gatewayRef,
      paidAt,
      null,
      collectedFor('growth', 'yearly'),
    );
    expect(told.status).toBe(HttpStatus.OK);

    expect(await harness.subscriptionOf(owner.subscriptionId)).toMatchObject({
      state: 'active',
      tier: 'growth',
      cycle: 'yearly',
      collection: 'invoice',
      mandateEndingAt: null,
      gatewayRef: page.gatewayRef,
    });
    expect(await screen.limitOf(owner.company.tenantId, 'storage_gb')).toBe(GROWTH_STORAGE_GB);
  });

  it('a monthly conversion rides the mandate rail and records it on the row', async () => {
    const owner = await harness.anOwnerOnATrial('Plan Screen Monthly EPC');
    expect((await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    const paidAt = Date.now() - A_MINUTE;
    await harness.tellPaid(page.gatewayRef, paidAt, null, collectedFor('starter', 'monthly'));
    expect((await harness.subscriptionOf(owner.subscriptionId))?.collection).toBe('mandate');
  });
});
