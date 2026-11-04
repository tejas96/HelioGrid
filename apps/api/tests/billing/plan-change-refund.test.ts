import { creditNote } from '@heliogrid/db';
import { IN_PACK, minorUnits } from '@heliogrid/domain';
import { platformSaleTotal } from '@heliogrid/domain/server';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RefundAdminRepository } from '../../src/modules/billing/refund.admin.repository';
import { MarketPackService } from '../../src/modules/market/market.public';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness, chargeRefOf } from './conversion-harness';
import { midCycle, PlanScreen } from './plan-change-bench';

/**
 * The first cycle's refund with an upgrade paid inside it (`M12-47`, `M12-48`): both charges go
 * back to their source in the one act, each invoice under its own credit note, and a retry issues
 * no note twice.
 */

const skip = skipWithoutDatabase(
  'UPGRADE REFUND PROOF',
  'The refund of an upgrade paid inside the first cycle is UNPROVEN in this run.',
);

/** Two days into its first 30-day cycle: inside the 7-day window. */
const DAYS_LEFT = 28;

describe.skipIf(skip)('the first cycle’s refund pays back its upgrade too (M12-47)', () => {
  let harness: ConversionHarness;
  let screen: PlanScreen;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
    screen = new PlanScreen(harness);
  });

  afterAll(async () => {
    await harness.close();
  });

  it('a refund inside the first cycle pays back its proration with its own credit note, once', async () => {
    const owner = await midCycle(harness, 'Upgrade Refund EPC', DAYS_LEFT);
    const { tenantId } = owner.company;
    expect((await screen.confirm(owner, { tier: 'pro', cycle: 'monthly' })).body.outcome).toBe(
      'page',
    );
    const page = await harness.openCheckoutOf(owner.subscriptionId);
    const prorationPaid = platformSaleTotal(IN_PACK, minorUnits(page.chargeMinor ?? 0));
    const paidAt = Date.now();
    await harness.tellPaid(page.gatewayRef, paidAt, null, prorationPaid);
    const invoices = await harness.invoicesOf(tenantId);
    const proration = invoices.find((invoice) => invoice.kind === 'proration');
    const cycle = invoices.find((invoice) => invoice.kind === 'cycle');

    const reply = await harness.http.call<{ creditNoteNumber?: string }>(
      'POST',
      '/billing/refund',
      {},
      await owner.headers(),
    );
    expect(reply.status).toBe(HttpStatus.OK);

    const prorationCharge = chargeRefOf(page.gatewayRef, paidAt);
    expect(harness.gateway.refundOf(prorationCharge)).toEqual({
      chargeRef: prorationCharge,
      amount: prorationPaid,
      reference: proration?.id,
    });
    expect(harness.gateway.refundOf(owner.chargeRef)?.amount).toBe(owner.amount);
    const notes = await harness.pools.admin.db
      .select()
      .from(creditNote)
      .where(eq(creditNote.tenantId, tenantId));
    expect(
      notes
        .map((note) => [note.invoiceId, note.amountMinor, note.gatewayRefundRef])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    ).toEqual(
      [
        [cycle?.id, owner.amount, `dev_refund_${owner.chargeRef}`],
        [proration?.id, prorationPaid, `dev_refund_${prorationCharge}`],
      ].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    );
    expect((await harness.invoicesOf(tenantId)).map((invoice) => invoice.status)).toEqual([
      'refunded',
      'refunded',
    ]);

    // The database half sent again — a lost answer retried — issues no note twice.
    const refunds = harness.http.app.get(RefundAdminRepository);
    const first = await refunds.firstPaymentOf(tenantId);
    if (first === null) throw new Error('no first payment');
    const pack = await harness.http.app.get(MarketPackService).currentPackOf('IN');
    const again = await refunds.record(
      tenantId,
      first,
      {
        gatewayRefundRef: `dev_refund_${owner.chargeRef}`,
        pack,
        prorations: [
          { invoiceId: proration?.id ?? '', gatewayRefundRef: `dev_refund_${prorationCharge}` },
        ],
      },
      { actorUserId: owner.ownerUserId, now: Date.now() },
    );
    expect(again).toEqual({ creditNoteNumber: reply.body.creditNoteNumber, eventIds: [] });
    expect(
      await harness.pools.admin.db
        .select()
        .from(creditNote)
        .where(eq(creditNote.tenantId, tenantId)),
    ).toHaveLength(2);
  });
});
