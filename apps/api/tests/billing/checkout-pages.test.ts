import { MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness } from './conversion-harness';
import { collectedFor } from './support';

/**
 * One hosted page collects at most once (`M12-09`, `M12-54`): a page the gateway already took
 * money on is never closed for a new pick, and money on a page a new pick closed converts nothing.
 */

const skip = skipWithoutDatabase(
  'HOSTED PAGE PROOF',
  'That a company can never pay two hosted pages is UNPROVEN in this run.',
);

const A_MINUTE_MS = 60_000;
const MONTH_DAYS = 30;

describe.skipIf(skip)('one hosted page collects at most once', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  it('a page already paid is never closed for a new pick: its charge converts, and the new pick is refused', async () => {
    const owner = await harness.anOwnerOnATrial('Paid Page EPC');
    expect((await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const paidPage = await harness.openCheckoutOf(owner.subscriptionId);
    // Paid at the gateway; its message has not landed.
    const chargedAt = Date.now() - A_MINUTE_MS;
    harness.gateway.collect({
      gatewayRef: paidPage.gatewayRef,
      chargeRef: `pay_unannounced_${paidPage.gatewayRef}`,
      occurredAt: chargedAt,
      paysThrough: chargedAt + MONTH_DAYS * MS_PER_DAY,
      amount: collectedFor('growth', 'monthly'),
      currencyCode: 'INR',
    });

    const reply = await harness.checkout(owner, { tier: 'growth', cycle: 'yearly' });

    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('CHECKOUT_NOT_POSSIBLE');
    expect(await harness.subscriptionOf(owner.subscriptionId)).toMatchObject({
      state: 'active',
      tier: 'growth',
      cycle: 'monthly',
      gatewayRef: paidPage.gatewayRef,
    });
    expect((await harness.checkoutsOf(owner.subscriptionId)).all).toHaveLength(1);
  });

  it('money on the open page that the charge path refuses does not hold the company on that page', async () => {
    const owner = await harness.anOwnerOnATrial('Refused Page EPC');
    expect((await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const refusedPage = await harness.openCheckoutOf(owner.subscriptionId);
    const chargedAt = Date.now() - A_MINUTE_MS;
    // Collected in a currency the company is not billed in: no subscription can take it.
    harness.gateway.collect({
      gatewayRef: refusedPage.gatewayRef,
      chargeRef: `pay_usd_${refusedPage.gatewayRef}`,
      occurredAt: chargedAt,
      paysThrough: chargedAt + MONTH_DAYS * MS_PER_DAY,
      amount: collectedFor('growth', 'monthly'),
      currencyCode: 'USD',
    });

    const reply = await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' });

    expect(reply.status).toBe(HttpStatus.OK);
    const pages = await harness.checkoutsOf(owner.subscriptionId);
    expect(pages.open.map((page) => page.gatewayRef)).not.toContain(refusedPage.gatewayRef);
    expect(await harness.subscriptionOf(owner.subscriptionId)).toMatchObject({ state: 'trialing' });
  });

  it('a charge on a page a new pick closed is refused and alerted, and moves no plan', async () => {
    const owner = await harness.anOwnerOnATrial('Closed Page EPC');
    expect((await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const closedPage = await harness.openCheckoutOf(owner.subscriptionId);
    expect((await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const raise = vi.spyOn(harness.http.app.get(BillingAlerts), 'raise');

    const chargedAt = Date.now() - A_MINUTE_MS;
    const reply = await harness.tellPaid(
      closedPage.gatewayRef,
      chargedAt,
      chargedAt + MONTH_DAYS * MS_PER_DAY,
      collectedFor('growth', 'monthly'),
    );

    expect(reply.status).toBe(HttpStatus.OK);
    expect(raise).toHaveBeenCalledWith('billing_charge_refused', expect.anything());
    raise.mockRestore();
    expect(await harness.subscriptionOf(owner.subscriptionId)).toMatchObject({
      state: 'trialing',
      tier: null,
      gatewayRef: null,
    });
  });
});
