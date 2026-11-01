import { billingCheckout, subscription } from '@heliogrid/db';
import {
  bookEntitlements,
  type Entitlement,
  IN_PACK,
  MS_PER_DAY,
  REACTIVATION_PAGE_HOURS,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EntitlementService } from '../../src/modules/billing/billing.public';
import { cycleEnd } from '../../src/modules/billing/internal/cycle-end';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { ConversionHarness } from './conversion-harness';
import { collectedFor } from './support';

/**
 * Reactivation over HTTP (`M12-08`): a halted, expired or cancelled company opens a new hosted
 * page through `POST /billing/checkout`, and the charge that pays it starts a NEW `active` row with
 * the page's plan — the dead row and every record on it stay as they were.
 */

const skip = skipWithoutDatabase(
  'REACTIVATION WIRE PROOF',
  'A dead company paying its way back to a new subscription is UNPROVEN in this run.',
);

const A_MINUTE_MS = 60_000;
const A_YEAR_DAYS = 365;
const MONTH_DAYS = 30;
const SECONDS_PER_HOUR = 3_600;
const MS_PER_SECOND = 1_000;
const MS_PER_HOUR = SECONDS_PER_HOUR * MS_PER_SECOND;

/** The limits as the hot read hands them out, in key order. */
const asRead = (limits: readonly Entitlement[]) => new Map(limits.map((one) => [one.key, one]));

describe.skipIf(skip)('reactivation through a new hosted page (M12-08)', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  /** A company that paid Starter long ago and was halted `haltedDaysAgo` days back. */
  async function aHaltedCompany(name: string, haltedDaysAgo: number) {
    const now = Date.now();
    const paid = await harness.aPaidOwner(name, {
      tier: 'starter',
      cycle: 'monthly',
      paidAt: now - (haltedDaysAgo + MONTH_DAYS) * MS_PER_DAY,
    });
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'halted', stateEnteredAt: new Date(now - haltedDaysAgo * MS_PER_DAY) })
      .where(eq(subscription.id, paid.subscriptionId));
    return paid;
  }

  it('a company halted for a year pays and gets a new subscription with live entitlements and every record kept', async () => {
    const halted = await aHaltedCompany('Year Halted EPC', A_YEAR_DAYS);
    const { tenantId } = halted.company;
    const before = {
      row: await harness.subscriptionOf(halted.subscriptionId),
      invoices: await harness.invoicesOf(tenantId),
      payments: await harness.paymentsOf(tenantId),
      history: await harness.historyOf(tenantId),
    };

    const opened = await harness.checkout(halted, { tier: 'growth', cycle: 'monthly' });
    expect(opened.status).toBe(HttpStatus.OK);
    const page = await harness.openCheckoutOf(halted.subscriptionId);
    expect(page.startsAt).toBeNull();
    expect(page.expiresAt.getTime() - page.openedAt.getTime()).toBe(
      REACTIVATION_PAGE_HOURS * MS_PER_HOUR,
    );
    expect(page.openedBy).toBe(halted.ownerUserId);

    const chargedAt = Date.now() - A_MINUTE_MS;
    const periodEnd = chargedAt + MONTH_DAYS * MS_PER_DAY;
    const amount = collectedFor('growth', 'monthly');
    const told = await harness.tellPaid(page.gatewayRef, chargedAt, periodEnd, amount);
    expect(told.status).toBe(HttpStatus.OK);

    const rows = await harness.subscriptionsOf(tenantId);
    expect(rows).toHaveLength(2);
    const [old, started] = rows;
    // The dead row and every record on it are exactly as they were.
    expect(old).toEqual(before.row);
    expect(started).toMatchObject({
      state: 'active',
      tier: 'growth',
      cycle: 'monthly',
      planPriceId: page.planPriceId,
      gatewayRef: page.gatewayRef,
    });
    expect(started?.stateEnteredAt.getTime()).toBe(chargedAt);
    expect(started?.paidPeriodEnd?.getTime()).toBe(periodEnd);

    const invoices = await harness.invoicesOf(tenantId);
    expect(invoices.slice(0, before.invoices.length)).toEqual(before.invoices);
    const [issued, ...more] = invoices.slice(before.invoices.length);
    expect(more).toEqual([]);
    expect(issued).toMatchObject({ subscriptionId: started?.id, status: 'paid' });

    const payments = await harness.paymentsOf(tenantId);
    expect(payments.slice(0, before.payments.length)).toEqual(before.payments);
    expect(payments.slice(before.payments.length)).toMatchObject([
      { subscriptionId: started?.id, amountMinor: amount, id: issued?.paymentId },
    ]);

    const history = await harness.historyOf(tenantId);
    expect(history.slice(0, before.history.length)).toEqual(before.history);
    expect(history.slice(before.history.length)).toMatchObject([
      { subscriptionId: started?.id, state: 'active', cause: 'paid' },
    ]);

    expect(await harness.http.app.get(EntitlementService).limitsOf(tenantId)).toEqual(
      asRead(bookEntitlements(IN_PACK.priceBook, 'growth')),
    );
    expect(
      (await harness.auditOf(tenantId)).filter(
        (entry) => entry.eventType === 'billing.reactivated',
      ),
    ).toMatchObject([
      {
        actorKind: 'tenant_user',
        actorRef: halted.ownerUserId,
        subjectKind: 'subscription',
        subjectRef: started?.id,
      },
    ]);
    expect((await harness.checkoutsOf(halted.subscriptionId)).open).toEqual([]);
  });

  it('a second charge on the same page starts no second subscription', async () => {
    const halted = await aHaltedCompany('Twice Charged EPC', MONTH_DAYS);
    const { tenantId } = halted.company;
    expect((await harness.checkout(halted, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const page = await harness.openCheckoutOf(halted.subscriptionId);
    const amount = collectedFor('growth', 'monthly');
    const first = Date.now() - 2 * A_MINUTE_MS;
    const second = first + A_MINUTE_MS;

    // Both charges have read the page as open; each waits on the dead row's lock.
    const held = await holdLock(
      sql`select id from subscription where id = ${halted.subscriptionId} for update`,
    );
    const replies = Promise.all(
      [first, second].map((at) =>
        harness.tellPaid(page.gatewayRef, at, at + MONTH_DAYS * MS_PER_DAY, amount),
      ),
    );
    await held.waitForWaiters(2);
    await held.release();
    expect((await replies).map((reply) => reply.status)).toEqual([HttpStatus.OK, HttpStatus.OK]);

    const rows = await harness.subscriptionsOf(tenantId);
    expect(rows.map((row) => row.state)).toEqual(['halted', 'active']);
    const [dead, live] = rows;
    // Both payments are kept: one started the new row, the other landed on the dead one.
    const newPayments = (await harness.paymentsOf(tenantId)).filter(
      (payment) => payment.amountMinor === amount,
    );
    expect(newPayments.map((payment) => payment.subscriptionId).sort()).toEqual(
      [dead?.id, live?.id].sort(),
    );
    expect(
      (await harness.auditOf(tenantId)).filter(
        (entry) => entry.eventType === 'billing.reactivated',
      ),
    ).toHaveLength(1);
  });

  it('an expired trial reactivates on a new row and the trial row stays expired', async () => {
    const owner = await harness.anOwnerOnATrial('Expired Trial EPC');
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'expired', stateEnteredAt: new Date(Date.now() - MONTH_DAYS * MS_PER_DAY) })
      .where(eq(subscription.id, owner.subscriptionId));

    expect((await harness.checkout(owner, { tier: 'starter', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    const chargedAt = Date.now() - A_MINUTE_MS;
    await harness.tellPaid(
      page.gatewayRef,
      chargedAt,
      chargedAt + MONTH_DAYS * MS_PER_DAY,
      collectedFor('starter', 'monthly'),
    );

    const rows = await harness.subscriptionsOf(owner.company.tenantId);
    expect(rows.map((row) => [row.id === owner.subscriptionId, row.state, row.tier])).toEqual([
      [true, 'expired', null],
      [false, 'active', 'starter'],
    ]);
  });

  it('an expired trial whose own page went unpaid reactivates on a new page, never the dead one', async () => {
    const owner = await harness.anOwnerOnATrial('Unpaid Page EPC');
    const trialPage = await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' });
    expect(trialPage.status).toBe(HttpStatus.OK);
    // The trial ended a day ago, and its page with it.
    const trialEnded = new Date(Date.now() - MS_PER_DAY);
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'expired', stateEnteredAt: trialEnded, trialEndsAt: trialEnded })
      .where(eq(subscription.id, owner.subscriptionId));
    await harness.pools.admin.db
      .update(billingCheckout)
      .set({ expiresAt: trialEnded })
      .where(eq(billingCheckout.subscriptionId, owner.subscriptionId));

    const reply = await harness.checkout(owner, { tier: 'growth', cycle: 'monthly' });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.checkoutUrl).not.toBe(trialPage.body.checkoutUrl);
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    expect(page.hostedUrl).toBe(reply.body.checkoutUrl);
    expect(page.expiresAt.getTime() - page.openedAt.getTime()).toBe(
      REACTIVATION_PAGE_HOURS * MS_PER_HOUR,
    );
  });

  it('a cancelled company still running reactivates from its period end, so no day is paid twice', async () => {
    const paid = await harness.aPaidOwner('Running Cancelled EPC', {
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

    expect((await harness.checkout(paid, { tier: 'growth', cycle: 'monthly' })).status).toBe(
      HttpStatus.OK,
    );
    const page = await harness.openCheckoutOf(paid.subscriptionId);
    expect(page.startsAt?.getTime()).toBe(paid.paidPeriodEnd);

    // A mandate's first debit names no period here: the period is worked out from the page's start.
    await harness.tellPaid(
      page.gatewayRef,
      Date.now() - A_MINUTE_MS,
      null,
      collectedFor('growth', 'monthly'),
    );

    const [old, started] = await harness.subscriptionsOf(paid.company.tenantId);
    expect(old).toMatchObject({ state: 'cancelled' });
    expect(old?.paidPeriodEnd?.getTime()).toBe(paid.paidPeriodEnd);
    expect(started?.state).toBe('active');
    expect(started?.paidPeriodEnd?.getTime()).toBe(cycleEnd(paid.paidPeriodEnd, 'monthly'));
  });

  it.each(['active', 'past_due'] as const)(
    'a %s company is still refused a checkout with CHECKOUT_NOT_POSSIBLE',
    async (state) => {
      const paid = await harness.aPaidOwner(`Live ${state} EPC`, {
        tier: 'starter',
        cycle: 'monthly',
        paidAt: Date.now() - MS_PER_DAY,
      });
      await harness.pools.admin.db
        .update(subscription)
        .set({ state })
        .where(eq(subscription.id, paid.subscriptionId));

      const reply = await harness.checkout(paid, { tier: 'growth', cycle: 'monthly' });
      expect(reply.status).toBe(HttpStatus.CONFLICT);
      expect(reply.body.error?.code).toBe('CHECKOUT_NOT_POSSIBLE');
      expect((await harness.checkoutsOf(paid.subscriptionId)).open).toEqual([]);
    },
  );
});
