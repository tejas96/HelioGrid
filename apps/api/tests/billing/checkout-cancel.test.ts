import { MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness } from './conversion-harness';
import { collectedFor } from './support';

/**
 * A new pick cancels the open page at the gateway (`M12-09`, `M12-54`). The cancel is safe to send
 * again, so a lost answer never leaves the company stuck, and a cancelled page is never handed out.
 */

const skip = skipWithoutDatabase(
  'CHECKOUT CANCEL PROOF',
  'That a lost or racing cancel never strands a company is UNPROVEN in this run.',
);

const A_MINUTE_MS = 60_000;
const MONTH_DAYS = 30;

describe.skipIf(skip)('a new pick cancels the open page', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  it('a cancel whose answer was lost is sent again, and its page is never handed out again', async () => {
    const owner = await harness.anOwnerOnATrial('Lost Cancel EPC');
    expect((await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const first = await harness.openCheckoutOf(owner.subscriptionId);
    // The gateway cancelled the page, but its answer never came back.
    const close = vi
      .spyOn(harness.gateway, 'closeCheckout')
      .mockRejectedValueOnce(new Error('timed out'));

    const lost = await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' });
    expect(lost.status).toBe(HttpStatus.BAD_GATEWAY);

    const again = await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' });
    close.mockRestore();

    expect(again.status).toBe(HttpStatus.OK);
    expect(again.body.checkoutUrl).not.toBe(first.hostedUrl);
    const pages = await harness.checkoutsOf(owner.subscriptionId);
    expect(pages.open).toHaveLength(1);
    expect(pages.open[0]?.gatewayRef).not.toBe(first.gatewayRef);
  });

  it('a mandate charged while its cancel was under way converts the company and raises one alert', async () => {
    const owner = await harness.anOwnerOnATrial('Racing Mandate EPC');
    expect((await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    const chargedAt = Date.now() - A_MINUTE_MS;
    // The owner approves the mandate on the old page while the cancel is on its way.
    const close = vi.spyOn(harness.gateway, 'closeCheckout').mockImplementationOnce(async () => {
      harness.gateway.collect({
        gatewayRef: page.gatewayRef,
        chargeRef: `pay_racing_${page.gatewayRef}`,
        occurredAt: chargedAt,
        paysThrough: chargedAt + MONTH_DAYS * MS_PER_DAY,
        amount: collectedFor('growth', 'monthly'),
        currencyCode: 'INR',
      });
    });
    const raise = vi.spyOn(harness.http.app.get(BillingAlerts), 'raise');

    const reply = await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' });
    close.mockRestore();
    const cancelledMandate = raise.mock.calls.filter(
      ([alert]) => alert === 'billing_cancelled_mandate',
    );
    raise.mockRestore();

    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(await harness.subscriptionOf(owner.subscriptionId)).toMatchObject({
      state: 'active',
      tier: 'growth',
      cycle: 'monthly',
      gatewayRef: page.gatewayRef,
    });
    expect(cancelledMandate).toHaveLength(1);
  });
});
