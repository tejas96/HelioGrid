import { subscription } from '@heliogrid/db';
import { MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness } from './conversion-harness';
import { collectedFor } from './support';

/**
 * Conversion over HTTP (`M12-54`, `M12-10`, `M12-11`): a trial opens the gateway's hosted page on
 * the rail the market's ladder names, and the charge that pays it makes the company `active` at
 * once with the plan it chose. The development gateway stands in for the market's; its messages
 * carry its own signature.
 */

const skip = skipWithoutDatabase(
  'CONVERSION WIRE PROOF',
  'Hosted checkout and the conversion it ends in are UNPROVEN in this run.',
);

const A_MINUTE_MS = 60_000;
const MONTH_DAYS = 30;

describe.skipIf(skip)('conversion through hosted checkout (M12-54)', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  it('a monthly checkout rides the mandate rail and a yearly one a payment link, as the pack’s ladder says', async () => {
    const owner = await harness.anOwnerOnATrial('Ladder EPC');

    const monthly = await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' });
    expect(monthly.status).toBe(HttpStatus.OK);
    const first = await harness.checkoutsOf(owner.subscriptionId);
    expect(first.open.map((row) => row.collection)).toEqual(['mandate']);
    expect(first.open[0]?.expiresAt.getTime()).toBe(harness.trialEndsAt);

    const again = await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' });
    expect(again.body.checkoutUrl).toBe(monthly.body.checkoutUrl);

    const yearly = await harness.checkout(owner, { tier: 'growth', cycle: 'yearly' });
    expect(yearly.status).toBe(HttpStatus.OK);
    const second = await harness.checkoutsOf(owner.subscriptionId);
    expect(second.open.map((row) => row.collection)).toEqual(['invoice']);
    expect(second.all).toHaveLength(2);
  });

  it('the checkout answer carries a hosted URL and no payment instrument field', async () => {
    const owner = await harness.anOwnerOnATrial('Hosted EPC');
    const reply = await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(Object.keys(reply.body)).toEqual(['checkoutUrl']);
    expect(new URL(reply.body.checkoutUrl ?? '').protocol).toBe('https:');
  });

  it('a confirmed checkout makes the trial active at once with its tier and a window from the charge', async () => {
    const owner = await harness.anOwnerOnATrial('Converted EPC');
    expect((await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const opened = await harness.openCheckoutOf(owner.subscriptionId);
    const chargedAt = Date.now() - A_MINUTE_MS;
    const periodEnd = chargedAt + MONTH_DAYS * MS_PER_DAY;

    const reply = await harness.tellPaid(
      opened.gatewayRef,
      chargedAt,
      periodEnd,
      collectedFor('growth', 'monthly'),
    );
    expect(reply.status).toBe(HttpStatus.OK);

    const converted = await harness.subscriptionOf(owner.subscriptionId);
    expect(converted).toMatchObject({
      state: 'active',
      tier: 'growth',
      cycle: 'monthly',
      planPriceId: opened.planPriceId,
      gatewayRef: opened.gatewayRef,
    });
    expect(converted?.stateEnteredAt.getTime()).toBe(chargedAt);
    expect(converted?.paidPeriodEnd?.getTime()).toBe(periodEnd);
    expect((await harness.checkoutsOf(owner.subscriptionId)).open).toEqual([]);
  });

  it('a checkout paid before the trial expired makes it active even when its message lands after the expiry', async () => {
    const owner = await harness.anOwnerOnATrial('Late Message EPC');
    expect((await harness.checkout(owner, { tier: 'starter', cycle: 'yearly' })).status).toBe(
      HttpStatus.OK,
    );
    const opened = await harness.openCheckoutOf(owner.subscriptionId);
    // The expiry timer ran before the message landed.
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'expired', stateEnteredAt: new Date(harness.trialEndsAt) })
      .where(eq(subscription.id, owner.subscriptionId));

    const paidAt = harness.trialEndsAt - A_MINUTE_MS;
    await harness.tellPaid(opened.gatewayRef, paidAt, null, collectedFor('starter', 'yearly'));

    const converted = await harness.subscriptionOf(owner.subscriptionId);
    expect(converted).toMatchObject({ state: 'active', tier: 'starter', cycle: 'yearly' });
    // A payment link names no period: a year from the moment it was paid.
    const yearOn = new Date(paidAt);
    yearOn.setUTCFullYear(yearOn.getUTCFullYear() + 1);
    expect(converted?.paidPeriodEnd?.getTime()).toBe(yearOn.getTime());
  });

  it('refuses Enterprise, which is sold, never bought, with TIER_NOT_SOLD', async () => {
    const owner = await harness.anOwnerOnATrial('Enterprise EPC');
    const reply = await harness.checkout(owner, { tier: 'enterprise', cycle: 'yearly' });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body.error?.code).toBe('TIER_NOT_SOLD');
    expect((await harness.checkoutsOf(owner.subscriptionId)).all).toEqual([]);
  });

  it('refuses a company that is not on its trial with CHECKOUT_NOT_POSSIBLE', async () => {
    const owner = await harness.anOwnerOnATrial('Lapsed EPC');
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'expired' })
      .where(eq(subscription.id, owner.subscriptionId));
    const reply = await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('CHECKOUT_NOT_POSSIBLE');
  });

  it('asks a caller with no sign-in to sign in, with 401 and never a 500', async () => {
    const reply = await harness.http.callAnonymously('POST', '/billing/checkout', {
      tier: 'growth',
      cycle: 'monthly',
    });
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
