import { type DbTransaction, overageAddOn } from '@heliogrid/db';
import { type MinorUnits, minorUnits } from '@heliogrid/domain';
import { and, asc, eq, inArray, lte, ne } from 'drizzle-orm';

/**
 * The overage add-ons' half of the charge transaction (`M12-35`): which add-ons a debit collected,
 * and marking them on its invoice. Free functions on the caller's transaction, so a payment, its
 * invoice and its add-ons commit together.
 */

/** The columns a row at no gateway holds empty. */
export const atNoGateway = {
  gatewayRef: null,
  gatewayAddOnRef: null,
  gatewayAmountMinor: null,
  addedAt: null,
};

/** An add-on a debit collected, as its invoice line reads it. */
export interface CollectedAddOn {
  readonly id: string;
  readonly amount: MinorUnits;
}

/**
 * The add-ons the debit on `gatewayRef` at `occurredAt` collected, in the charge's transaction:
 * every one added to that mandate before the debit, by period, then in the ledger's meter order. An add-on still on another mandate of the
 * subscription — one a new pick cancelled — goes back to `pending`, so the sweep adds it to this one.
 */
export async function addOnsCollectedBy(
  tx: DbTransaction,
  charge: { tenantId: string; subscriptionId: string; gatewayRef: string; occurredAt: number },
): Promise<CollectedAddOn[]> {
  const ofSubscription = and(
    eq(overageAddOn.tenantId, charge.tenantId),
    eq(overageAddOn.subscriptionId, charge.subscriptionId),
    eq(overageAddOn.status, 'added'),
  );
  await tx
    .update(overageAddOn)
    // On a new mandate it starts untried: its old tries were the old mandate's.
    .set({ ...atNoGateway, status: 'pending', triedAt: null })
    .where(and(ofSubscription, ne(overageAddOn.gatewayRef, charge.gatewayRef)));
  const rows = await tx
    .select({ id: overageAddOn.id, amount: overageAddOn.amountMinor })
    .from(overageAddOn)
    .where(
      and(
        ofSubscription,
        eq(overageAddOn.gatewayRef, charge.gatewayRef),
        lte(overageAddOn.addedAt, new Date(charge.occurredAt)),
      ),
    )
    .orderBy(asc(overageAddOn.windowFrom), asc(overageAddOn.meter));
  return rows.map((row) => ({ id: row.id, amount: minorUnits(row.amount) }));
}

/** Marks the add-ons an invoice lists as on it. */
export async function markInvoiced(
  tx: DbTransaction,
  addOnIds: readonly string[],
  invoiceId: string,
): Promise<void> {
  if (addOnIds.length === 0) return;
  await tx
    .update(overageAddOn)
    .set({ status: 'invoiced', invoiceId })
    .where(inArray(overageAddOn.id, [...addOnIds]));
}
