import { subscription } from '@heliogrid/db';
import { MS_PER_DAY, reactivationPageExpiresAt } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CheckoutService } from '../../src/modules/billing/checkout.service';
import { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness } from './conversion-harness';
import { chargeServiceOf, collectedFor, RecordedAlerts, silentLogger } from './support';

/**
 * Two edges of reactivation (`M12-08`): a running cancelled company's page outlives a second
 * press, and a halted mandate company's old mandate is closed once the new row is paid.
 */

const skip = skipWithoutDatabase(
  'REACTIVATION EDGE PROOF',
  'A running cancelled page and a halted mandate’s closing are UNPROVEN in this run.',
);

const A_MINUTE_MS = 60_000;
const MONTH_DAYS = 30;

describe.skipIf(skip)('reactivation page and old mandate (M12-08)', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  it("a running cancelled company's reactivation page stays open until its period ends, and a second press a day later answers the same page", async () => {
    const paid = await harness.aPaidOwner('Second Press EPC', {
      tier: 'growth',
      cycle: 'monthly',
      paidAt: Date.now() - 10 * MS_PER_DAY,
    });
    const cancelled = await harness.http.call(
      'POST',
      '/billing/cancel',
      { reason: null },
      await paid.headers(),
    );
    expect(cancelled.status).toBe(HttpStatus.OK);
    const first = await harness.checkout(paid, { tier: 'growth', cycle: 'monthly' });
    expect(first.status).toBe(HttpStatus.OK);
    const page = await harness.openCheckoutOf(paid.subscriptionId);
    // Ours a day past the period end, until the first debit's charge lands there.
    expect(page.expiresAt.getTime()).toBe(reactivationPageExpiresAt(paid.paidPeriodEnd));
    expect(page.startsAt?.getTime()).toBe(paid.paidPeriodEnd);

    const aDayLater = Date.now() + MS_PER_DAY + A_MINUTE_MS;
    const second = await harness.http.app
      .get(CheckoutService)
      .open(
        paid.company.tenantId,
        { tier: 'growth', cycle: 'monthly' },
        { actorUserId: paid.ownerUserId, now: aDayLater },
      );
    expect(second.checkoutUrl).toBe(first.body.checkoutUrl);
    // Past the period end, before the first debit is recorded: still the same approved page.
    const afterTheEnd = paid.paidPeriodEnd + A_MINUTE_MS;
    const third = await harness.http.app
      .get(CheckoutService)
      .open(
        paid.company.tenantId,
        { tier: 'growth', cycle: 'monthly' },
        { actorUserId: paid.ownerUserId, now: afterTheEnd },
      );
    expect(third.checkoutUrl).toBe(first.body.checkoutUrl);
    const { open } = await harness.checkoutsOf(paid.subscriptionId);
    expect(open.map((row) => [row.id, row.cancelRequestedAt])).toEqual([[page.id, null]]);
  });

  /** A growth company on a mandate, halted, whose reactivation page is open and ready to be paid. */
  async function aHaltedMandateCompany(name: string) {
    const paid = await harness.aPaidOwner(name, {
      tier: 'growth',
      cycle: 'monthly',
      paidAt: Date.now() - 2 * MONTH_DAYS * MS_PER_DAY,
    });
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'halted', stateEnteredAt: new Date(Date.now() - MS_PER_DAY) })
      .where(eq(subscription.id, paid.subscriptionId));
    expect((await harness.checkout(paid, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    return { paid, page: await harness.openCheckoutOf(paid.subscriptionId) };
  }

  it("a halted mandate company's old mandate is closed when its reactivation charge lands", async () => {
    const { paid, page } = await aHaltedMandateCompany('Old Mandate EPC');
    expect(page.collection).toBe('mandate');
    expect(harness.gateway.wasClosed(paid.gatewayRef)).toBe(false);

    const chargedAt = Date.now() - A_MINUTE_MS;
    const told = await harness.tellPaid(
      page.gatewayRef,
      chargedAt,
      chargedAt + MONTH_DAYS * MS_PER_DAY,
      collectedFor('growth', 'monthly'),
    );
    expect(told.status).toBe(HttpStatus.OK);

    expect(harness.gateway.wasClosed(paid.gatewayRef)).toBe(true);
    // The new row's own mandate is the one that stays open.
    expect(harness.gateway.wasClosed(page.gatewayRef)).toBe(false);
  });

  it('a gateway that cannot close the old mandate raises billing_old_mandate_open and the new row is still live', async () => {
    const { paid, page } = await aHaltedMandateCompany('Stuck Mandate EPC');
    class StuckGateway extends DevelopmentBillingGateway {
      override async closeCheckout(): Promise<void> {
        throw new Error('The operation was aborted due to timeout');
      }
    }
    const alerts = new RecordedAlerts(silentLogger());
    const charges = chargeServiceOf(harness.pools, alerts, new StuckGateway(silentLogger()));

    const chargedAt = Date.now() - A_MINUTE_MS;
    await expect(
      charges.recordCollected(
        {
          gatewayRef: page.gatewayRef,
          chargeRef: `pay_${page.gatewayRef}_${chargedAt}`,
          occurredAt: chargedAt,
          paysThrough: chargedAt + MONTH_DAYS * MS_PER_DAY,
          amount: collectedFor('growth', 'monthly'),
          currencyCode: 'INR',
        },
        Date.now(),
      ),
    ).resolves.toBe('recorded');

    expect(alerts.raised).toEqual([
      [
        'billing_old_mandate_open',
        { subscriptionId: paid.subscriptionId, gatewayRef: paid.gatewayRef },
      ],
    ]);
    expect((await harness.subscriptionsOf(paid.company.tenantId)).map((row) => row.state)).toEqual([
      'halted',
      'active',
    ]);
  });
});
