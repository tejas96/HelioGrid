import { entitlementBlockedEnvelope } from '@heliogrid/contracts';
import { subscription } from '@heliogrid/db';
import { type CancellationReason, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../../src/common/temporal/outbox.dispatcher';
import { BillingActsService } from '../../src/modules/billing/billing-acts.service';
import { CancellationAdminRepository } from '../../src/modules/billing/cancellation.admin.repository';
import { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { RefundAdminRepository } from '../../src/modules/billing/refund.admin.repository';
import { MarketPackService } from '../../src/modules/market/market.public';
import { declarationOf, pngOf } from '../files/support';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  ConversionHarness,
  NOT_BILLING,
  type PaidOwner,
  type TrialOwner,
} from './conversion-harness';
import { RecordedAlerts, silentLogger } from './support';

/**
 * Cancellation over HTTP (`M12-50`, `M12-04`): an Owner cancels an `active` plan, with a reason or
 * none, and service runs to the paid period end. A mandate is told to raise no debit after it
 * before the row moves, so a gateway that does not answer changes nothing.
 */

const skip = skipWithoutDatabase(
  'CANCELLATION WIRE PROOF',
  'Cancelling to the paid period end is UNPROVEN in this run.',
);

const UPLOAD_BYTES = 64;

/** A gateway that never answers a cancel. */
class SilentGateway extends DevelopmentBillingGateway {
  override async cancelAtCycleEnd(): Promise<void> {
    throw new Error('The operation was aborted due to timeout');
  }
}

describe.skipIf(skip)('an Owner cancels to the paid period end (M12-50)', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  const cancel = async (owner: TrialOwner, reason: CancellationReason | null) =>
    harness.http.call<{ runsUntil?: string; error?: { code: string } }>(
      'POST',
      '/billing/cancel',
      { reason },
      await owner.headers(),
    );

  const upload = async (owner: TrialOwner) =>
    harness.http.call(
      'POST',
      '/files',
      declarationOf(owner.company.tenantId, pngOf(UPLOAD_BYTES)),
      await owner.headers(),
    );

  const aGrowthMandate = (name: string): Promise<PaidOwner> =>
    harness.aPaidOwner(name, { tier: 'growth', cycle: 'monthly', paidAt: Date.now() - MS_PER_DAY });

  /** Everything a cancel could move, to compare before and after. */
  const recordsOf = async (owner: TrialOwner) => ({
    row: await harness.subscriptionOf(owner.subscriptionId),
    history: await harness.historyOf(owner.company.tenantId),
    audit: await harness.auditOf(owner.company.tenantId),
  });

  it('an owner cancels with or without a reason and service runs to the paid period end', async () => {
    for (const reason of ['too_expensive', null] as const) {
      const paid = await aGrowthMandate(`Cancels ${reason ?? 'silently'} EPC`);

      const reply = await cancel(paid, reason);
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body).toEqual({ runsUntil: new Date(paid.paidPeriodEnd).toISOString() });

      const row = await harness.subscriptionOf(paid.subscriptionId);
      expect(row).toMatchObject({ state: 'cancelled', cancellationReason: reason });
      expect(row?.paidPeriodEnd?.getTime()).toBe(paid.paidPeriodEnd);
      expect((await harness.historyOf(paid.company.tenantId)).at(-1)).toMatchObject({
        subscriptionId: paid.subscriptionId,
        state: 'cancelled',
        cause: 'cancelled',
      });
      expect(harness.gateway.endsAtCycleEnd(paid.gatewayRef)).toBe(true);
      expect(
        (await harness.auditOf(paid.company.tenantId)).filter(
          (entry) => entry.eventType === 'billing.subscription_cancelled',
        ),
      ).toMatchObject([
        {
          actorKind: 'tenant_user',
          actorRef: paid.ownerUserId,
          subjectKind: 'subscription',
          subjectRef: paid.subscriptionId,
        },
      ]);

      // Paid up until the period ends: a gated act still works.
      expect((await upload(paid)).status).toBe(HttpStatus.CREATED);
      // The period ran out: the same act is paused.
      await harness.pools.admin.db
        .update(subscription)
        .set({ paidPeriodEnd: new Date(Date.now() - MS_PER_DAY) })
        .where(eq(subscription.id, paid.subscriptionId));
      const after = await upload(paid);
      expect(after.status).toBe(HttpStatus.FORBIDDEN);
      expect(entitlementBlockedEnvelope.parse(after.body).error.blocked).toMatchObject({
        phase: 'cancelled_post_period',
      });
    }
  });

  it('a company a payment link collects cancels with no call to the gateway', async () => {
    const paid = await harness.aPaidOwner('Yearly Link EPC', {
      tier: 'growth',
      cycle: 'yearly',
      paidAt: Date.now() - MS_PER_DAY,
      periodDays: 365,
    });
    const reply = await cancel(paid, 'something_else');
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({ runsUntil: new Date(paid.paidPeriodEnd).toISOString() });
    expect(harness.gateway.endsAtCycleEnd(paid.gatewayRef)).toBe(false);
  });

  it('a second press answers CANCEL_NOT_POSSIBLE and moves nothing', async () => {
    const paid = await aGrowthMandate('Presses Twice EPC');
    expect((await cancel(paid, 'moving_tool')).status).toBe(HttpStatus.OK);
    const before = await recordsOf(paid);

    const again = await cancel(paid, 'too_expensive');
    expect(again.status).toBe(HttpStatus.CONFLICT);
    expect(again.body.error?.code).toBe('CANCEL_NOT_POSSIBLE');
    expect(await recordsOf(paid)).toEqual(before);
  });

  it('a trial is refused with CANCEL_NOT_POSSIBLE', async () => {
    const owner = await harness.anOwnerOnATrial('Cancels Trial EPC');
    const before = await recordsOf(owner);
    const reply = await cancel(owner, null);
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('CANCEL_NOT_POSSIBLE');
    expect(await recordsOf(owner)).toEqual(before);
  });

  it('a past-due company is refused with CANCEL_NOT_POSSIBLE and its mandate is left alone', async () => {
    const paid = await aGrowthMandate('Cancels Past Due EPC');
    await harness.pools.admin.db
      .update(subscription)
      .set({ state: 'past_due' })
      .where(eq(subscription.id, paid.subscriptionId));
    const before = await recordsOf(paid);

    const reply = await cancel(paid, null);
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('CANCEL_NOT_POSSIBLE');
    expect(await recordsOf(paid)).toEqual(before);
    expect(harness.gateway.endsAtCycleEnd(paid.gatewayRef)).toBe(false);
  });

  it('a member who is not the Owner is refused with 403 and nothing moves', async () => {
    const paid = await aGrowthMandate('Finance Cancels EPC');
    const member = await harness.aMemberOf(paid, NOT_BILLING);
    const before = await recordsOf(paid);

    const reply = await harness.http.call(
      'POST',
      '/billing/cancel',
      { reason: null },
      await member(),
    );
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
    expect(await recordsOf(paid)).toEqual(before);
    expect(harness.gateway.endsAtCycleEnd(paid.gatewayRef)).toBe(false);
  });

  it('a cancel the row outran raises the stray schedule alert', async () => {
    const paid = await aGrowthMandate('Outrun Cancel EPC');
    const { app } = harness.http;
    const alerts = new RecordedAlerts(silentLogger());
    const acts = new BillingActsService(
      app.get(CancellationAdminRepository),
      app.get(RefundAdminRepository),
      app.get(MarketPackService),
      harness.gateway,
      app.get(OutboxDispatcher),
      alerts,
      silentLogger(),
    );

    // A failed charge moves the row to past_due while the cancel waits on it: the mandate was
    // already told to end, and the database refuses.
    const held = await holdLock(
      sql`update subscription set state = 'past_due' where id = ${paid.subscriptionId}`,
    );
    const cancelling = acts.cancel(
      paid.company.tenantId,
      { reason: null },
      { actorUserId: paid.ownerUserId, now: Date.now() },
    );
    const refused = expect(cancelling).rejects.toMatchObject({
      code: 'CANCEL_NOT_POSSIBLE',
      status: HttpStatus.CONFLICT,
    });
    await held.waitForWaiters(1);
    await held.release();
    await refused;

    expect(harness.gateway.endsAtCycleEnd(paid.gatewayRef)).toBe(true);
    expect(alerts.raised).toEqual([
      [
        'billing_stray_cancel_schedule',
        { subscriptionId: paid.subscriptionId, gatewayRef: paid.gatewayRef },
      ],
    ]);
  });

  it('a gateway that does not answer is GATEWAY_UNAVAILABLE and nothing moves', async () => {
    const paid = await aGrowthMandate('Silent Gateway EPC');
    const { app } = harness.http;
    const acts = new BillingActsService(
      app.get(CancellationAdminRepository),
      app.get(RefundAdminRepository),
      app.get(MarketPackService),
      new SilentGateway(silentLogger()),
      app.get(OutboxDispatcher),
      app.get(BillingAlerts),
      silentLogger(),
    );
    const before = await recordsOf(paid);

    await expect(
      acts.cancel(
        paid.company.tenantId,
        { reason: null },
        {
          actorUserId: paid.ownerUserId,
          now: Date.now(),
        },
      ),
    ).rejects.toMatchObject({ code: 'GATEWAY_UNAVAILABLE', status: HttpStatus.BAD_GATEWAY });
    expect(await recordsOf(paid)).toEqual(before);
  });
});
