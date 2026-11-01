import { creditNote, subscription } from '@heliogrid/db';
import { MS_PER_DAY } from '@heliogrid/domain';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RefundAdminRepository } from '../../src/modules/billing/refund.admin.repository';
import { MarketPackService } from '../../src/modules/market/market.public';
import { skipWithoutDatabase } from '../support/fixture';
import { ConversionHarness, type PaidOwner } from './conversion-harness';

/**
 * The refund's database half when the row moved after the gateway paid (`M12-47`): the plan still
 * ends and the note is still issued, unless the row is dead.
 */

const skip = skipWithoutDatabase(
  'REFUND MOVED ROW PROOF',
  'A refund paid at the gateway on a row that moved is UNPROVEN in this run.',
);

describe.skipIf(skip)('a refund recorded on a row that moved meanwhile (M12-47)', () => {
  let harness: ConversionHarness;

  beforeAll(async () => {
    harness = await ConversionHarness.open();
  });

  afterAll(async () => {
    await harness.close();
  });

  const aFirstCycle = (name: string): Promise<PaidOwner> =>
    harness.aPaidOwner(name, { tier: 'growth', cycle: 'monthly', paidAt: Date.now() - MS_PER_DAY });

  const notesOf = (tenantId: string) =>
    harness.pools.admin.db.select().from(creditNote).where(eq(creditNote.tenantId, tenantId));

  /** The row set to `state` after the gateway has already refunded, then the database half runs. */
  const recordAfterMove = async (name: string, state: 'cancelled' | 'past_due' | 'halted') => {
    const paid = await aFirstCycle(name);
    const { tenantId } = paid.company;
    const { app } = harness.http;
    const repository = app.get(RefundAdminRepository);
    const first = await repository.firstPaymentOf(tenantId);
    if (first === null) throw new Error('the company has no first payment');
    await harness.pools.admin.db
      .update(subscription)
      .set({ state })
      .where(eq(subscription.id, paid.subscriptionId));
    const pack = await app.get(MarketPackService).currentPackOf('IN');
    const now = Date.now();
    const recorded = await repository.record(
      tenantId,
      first,
      { gatewayRefundRef: `dev_refund_${paid.chargeRef}`, pack },
      { actorUserId: paid.ownerUserId, now },
    );
    return { paid, recorded, now };
  };

  it.each(['cancelled', 'past_due'] as const)(
    'a refund the gateway paid still ends the plan and issues its note when the row moved meanwhile (%s)',
    async (state) => {
      const { paid, recorded, now } = await recordAfterMove(`Moved ${state} Refund EPC`, state);
      const { tenantId } = paid.company;

      expect(recorded?.creditNoteNumber).toMatch(/^CN-/);
      const row = await harness.subscriptionOf(paid.subscriptionId);
      expect(row?.state).toBe('cancelled');
      expect(row?.paidPeriodEnd?.getTime()).toBe(now);
      expect((await harness.historyOf(tenantId)).at(-1)).toMatchObject({
        state: 'cancelled',
        cause: 'refunded',
      });
      expect(await notesOf(tenantId)).toHaveLength(1);
    },
  );

  it('a refund the gateway paid on a halted row writes nothing and answers null', async () => {
    const { paid, recorded } = await recordAfterMove('Halted Refund EPC', 'halted');

    expect(recorded).toBeNull();
    expect((await harness.subscriptionOf(paid.subscriptionId))?.state).toBe('halted');
    expect(await notesOf(paid.company.tenantId)).toEqual([]);
  });
});
