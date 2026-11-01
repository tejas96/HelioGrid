import { creditNoteDocumentWorkflow } from '@heliogrid/contracts/workflows';
import { creditNote, orchestrationOutbox } from '@heliogrid/db';
import { localDate, localMinutes, MS_PER_DAY, refundWindowClosesAt } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../../src/common/temporal/outbox.dispatcher';
import { BillingActsService } from '../../src/modules/billing/billing-acts.service';
import { CancellationAdminRepository } from '../../src/modules/billing/cancellation.admin.repository';
import { BillingAlerts } from '../../src/modules/billing/internal/billing-alerts';
import { DevelopmentBillingGateway } from '../../src/modules/billing/internal/billing-gateway.development';
import { RefundAdminRepository } from '../../src/modules/billing/refund.admin.repository';
import { MarketPackService } from '../../src/modules/market/market.public';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { ConversionHarness, chargeRefOf, NOT_BILLING, type PaidOwner } from './conversion-harness';
import { silentLogger } from './support';

/**
 * The first cycle's refund over HTTP (`M12-47`): inside the window that runs through the seventh
 * calendar day on the company's clock, the first payment goes back to its source in full, the row
 * ends now and the invoice gets its credit note. A renewal cycle never refunds; it cancels to its
 * period end instead.
 */

const skip = skipWithoutDatabase(
  'REFUND WIRE PROOF',
  'The first cycle’s refund and its credit note are UNPROVEN in this run.',
);

const A_MINUTE_MS = 60_000;
const MONTH_DAYS = 30;
/** How far into its renewal cycle a company asks: past the first cycle's window. */
const DAYS_INTO_RENEWAL = 5;
const COMPANY_ZONE = 'Asia/Kolkata';
const MINUTES_PER_HOUR = 60;

/** A gateway that never answers a refund. */
class SilentGateway extends DevelopmentBillingGateway {
  override async refund(): Promise<string> {
    throw new Error('The operation was aborted due to timeout');
  }
}

type RefundReply = { creditNoteNumber?: string; error?: { code: string } };

describe.skipIf(skip)('the first paid cycle refunds inside its window (M12-47)', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  const refund = async (owner: PaidOwner) =>
    harness.http.call<RefundReply>('POST', '/billing/refund', {}, await owner.headers());

  const aFirstCycle = (name: string, paidAt = Date.now() - MS_PER_DAY): Promise<PaidOwner> =>
    harness.aPaidOwner(name, { tier: 'growth', cycle: 'monthly', paidAt });

  const notesOf = (tenantId: string) =>
    harness.pools.admin.db.select().from(creditNote).where(eq(creditNote.tenantId, tenantId));

  const noteEventsOf = (tenantId: string) =>
    harness.pools.admin.db
      .select()
      .from(orchestrationOutbox)
      .where(
        and(
          eq(orchestrationOutbox.tenantId, tenantId),
          eq(orchestrationOutbox.workflow, creditNoteDocumentWorkflow.name),
        ),
      );

  const refundAudit = async (tenantId: string) =>
    (await harness.auditOf(tenantId)).filter(
      (entry) => entry.eventType === 'billing.refund_issued',
    );

  it('a first paid cycle inside 7 days refunds to source with a credit note against its invoice', async () => {
    const paid = await aFirstCycle('Refunds Early EPC');
    const { tenantId } = paid.company;
    const [invoice] = await harness.invoicesOf(tenantId);

    const before = Date.now();
    const reply = await refund(paid);
    const after = Date.now();
    expect(reply.status).toBe(HttpStatus.OK);

    expect(harness.gateway.refundOf(paid.chargeRef)).toEqual({
      chargeRef: paid.chargeRef,
      amount: paid.amount,
      reference: invoice?.id,
    });
    const [refunded] = await harness.invoicesOf(tenantId);
    expect(refunded?.status).toBe('refunded');

    const notes = await notesOf(tenantId);
    expect(notes).toMatchObject([
      {
        invoiceId: invoice?.id,
        number: reply.body.creditNoteNumber,
        artefact: 'plain_credit_note',
        amountMinor: paid.amount,
        currencyCode: 'INR',
        gatewayRefundRef: `dev_refund_${paid.chargeRef}`,
      },
    ]);
    expect(reply.body.creditNoteNumber).toMatch(/^CN-\d{4}-\d{2}\/\d+$/);
    expect(reply.body.creditNoteNumber).not.toBe(invoice?.number);

    const row = await harness.subscriptionOf(paid.subscriptionId);
    expect(row?.state).toBe('cancelled');
    const endedAt = row?.paidPeriodEnd?.getTime() ?? 0;
    expect(endedAt).toBeGreaterThanOrEqual(before);
    expect(endedAt).toBeLessThanOrEqual(after);
    expect((await harness.historyOf(tenantId)).at(-1)).toMatchObject({
      subscriptionId: paid.subscriptionId,
      state: 'cancelled',
      cause: 'refunded',
    });

    const [note] = notes;
    expect((await noteEventsOf(tenantId)).map((event) => event.payload)).toEqual([
      expect.objectContaining({ tenantId, creditNoteId: note?.id }),
    ]);
    expect(await refundAudit(tenantId)).toMatchObject([
      {
        actorKind: 'tenant_user',
        actorRef: paid.ownerUserId,
        subjectKind: 'credit_note',
        subjectRef: note?.id,
      },
    ]);
  });

  it('a renewal cycle offers no refund and offers cancellation to the period end', async () => {
    const paid = await aFirstCycle(
      'Renewed EPC',
      Date.now() - (MONTH_DAYS + DAYS_INTO_RENEWAL) * MS_PER_DAY,
    );
    // The renewal debit landed two days ago, inside 7 days of today: still no refund.
    const renewedAt = Date.now() - 2 * MS_PER_DAY;
    const renewedThrough = paid.paidPeriodEnd + MONTH_DAYS * MS_PER_DAY;
    const renewal = await harness.tellPaid(paid.gatewayRef, renewedAt, renewedThrough, paid.amount);
    expect(renewal.status).toBe(HttpStatus.OK);

    const reply = await refund(paid);
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('REFUND_NOT_POSSIBLE');
    expect(harness.gateway.refundOf(paid.chargeRef)).toBeUndefined();
    expect(harness.gateway.refundOf(chargeRefOf(paid.gatewayRef, renewedAt))).toBeUndefined();
    expect(await notesOf(paid.company.tenantId)).toEqual([]);

    const cancelled = await harness.http.call(
      'POST',
      '/billing/cancel',
      { reason: 'business_pausing' },
      await paid.headers(),
    );
    expect(cancelled.status).toBe(HttpStatus.OK);
    expect(cancelled.body).toEqual({ runsUntil: new Date(renewedThrough).toISOString() });
  });

  /** A moment's calendar date and wall clock on the company's clock (domain's one reader). */
  const local = (at: number) => {
    const minutes = localMinutes(at, COMPANY_ZONE);
    const pad = (value: number) => String(value).padStart(2, '0');
    return {
      day: Date.parse(localDate(at, COMPANY_ZONE)) / MS_PER_DAY,
      time: `${pad(Math.floor(minutes / MINUTES_PER_HOUR))}:${pad(minutes % MINUTES_PER_HOUR)}`,
    };
  };

  it.each([
    {
      moment: 'the last minute of day 7',
      offset: -A_MINUTE_MS,
      day: 6,
      time: '23:59',
      refunds: true,
    },
    { moment: 'the first minute of day 8', offset: 0, day: 7, time: '00:00', refunds: false },
  ])(
    'a refund asked in $moment on the company’s clock refunds: $refunds',
    async ({ offset, day, time, refunds }) => {
      const paid = await aFirstCycle(`Window ${time} EPC`);
      const asked = refundWindowClosesAt(paid.paidAt, COMPANY_ZONE) + offset;
      // The payment's own day is day 1.
      expect(local(asked)).toEqual({ day: local(paid.paidAt).day + day, time });

      const acts = harness.http.app.get(BillingActsService);
      const act = { actorUserId: paid.ownerUserId, now: asked };
      if (refunds) {
        await expect(acts.refund(paid.company.tenantId, act)).resolves.toMatchObject({
          creditNoteNumber: expect.stringMatching(/^CN-/),
        });
        expect(harness.gateway.refundOf(paid.chargeRef)).toBeDefined();
      } else {
        await expect(acts.refund(paid.company.tenantId, act)).rejects.toMatchObject({
          code: 'REFUND_NOT_POSSIBLE',
          status: HttpStatus.CONFLICT,
        });
        expect(harness.gateway.refundOf(paid.chargeRef)).toBeUndefined();
      }
    },
  );

  it('two refunds racing on one payment issue one credit note and answer it to both', async () => {
    const paid = await aFirstCycle('Refunds Twice EPC');
    const { tenantId } = paid.company;

    // Both have refunded at the gateway (its retry is safe) and wait to write the database half.
    const held = await holdLock(
      sql`select id from subscription where id = ${paid.subscriptionId} for update`,
    );
    const replies = Promise.all([refund(paid), refund(paid)]);
    await held.waitForWaiters(2);
    await held.release();
    const [first, second] = await replies;

    expect([first.status, second.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(second.body.creditNoteNumber).toBe(first.body.creditNoteNumber);
    expect(await notesOf(tenantId)).toHaveLength(1);
    expect(await noteEventsOf(tenantId)).toHaveLength(1);
    expect(await refundAudit(tenantId)).toHaveLength(1);
    expect(
      (await harness.historyOf(tenantId)).filter((entry) => entry.cause === 'refunded'),
    ).toHaveLength(1);
  });

  /** Everything a refund could move, to compare before and after. */
  const recordsOf = async (paid: PaidOwner) => ({
    row: await harness.subscriptionOf(paid.subscriptionId),
    invoices: await harness.invoicesOf(paid.company.tenantId),
    history: await harness.historyOf(paid.company.tenantId),
    notes: await notesOf(paid.company.tenantId),
  });

  it('a member who is not the Owner is refused a refund with 403 and nothing moves', async () => {
    const paid = await aFirstCycle('Finance Refunds EPC');
    const member = await harness.aMemberOf(paid, NOT_BILLING);
    const before = await recordsOf(paid);

    const reply = await harness.http.call('POST', '/billing/refund', {}, await member());
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
    expect(await recordsOf(paid)).toEqual(before);
    expect(harness.gateway.refundOf(paid.chargeRef)).toBeUndefined();
  });

  it('a gateway that does not answer the refund is GATEWAY_UNAVAILABLE and nothing moves', async () => {
    const paid = await aFirstCycle('Silent Refund EPC');
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
      acts.refund(paid.company.tenantId, { actorUserId: paid.ownerUserId, now: Date.now() }),
    ).rejects.toMatchObject({ code: 'GATEWAY_UNAVAILABLE', status: HttpStatus.BAD_GATEWAY });
    expect(await recordsOf(paid)).toEqual(before);
  });
});
