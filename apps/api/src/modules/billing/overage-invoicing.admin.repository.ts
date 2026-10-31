import { type DbTransaction, overageAddOn } from '@heliogrid/db';
import { type MinorUnits, minorUnits } from '@heliogrid/domain';
import { and, asc, eq, inArray, lte, ne } from 'drizzle-orm';

/**
 * The overage add-ons' half of the charge and renewal transactions (`M12-35`): which add-ons a debit
 * collected or a renewal link takes, and marking them on its invoice. Free functions on the caller's transaction, so a payment, its
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

/** Marks the add-ons a debit's invoice lists as on it. */
export async function markInvoiced(
  tx: DbTransaction,
  addOns: readonly CollectedAddOn[],
  invoiceId: string,
): Promise<void> {
  if (addOns.length === 0) return;
  await tx
    .update(overageAddOn)
    .set({ status: 'invoiced', invoiceId })
    .where(
      inArray(
        overageAddOn.id,
        addOns.map((addOn) => addOn.id),
      ),
    );
}

/**
 * Marks the add-ons a renewal invoice lists as on its link (`M12-11`): the link collects them, so
 * each records it and what the link collects for it. Only rows still `pending` move; one that moved
 * since it was read throws, so the invoice and its link are never issued for an add-on billed
 * elsewhere.
 */
export async function markOnLink(
  tx: DbTransaction,
  addOns: readonly CollectedAddOn[],
  invoiceId: string,
  link: { gatewayRef: string; at: number; collectedOf: (amount: MinorUnits) => MinorUnits },
): Promise<void> {
  for (const addOn of addOns) {
    const [moved] = await tx
      .update(overageAddOn)
      .set({
        status: 'invoiced',
        invoiceId,
        gatewayRef: link.gatewayRef,
        gatewayAmountMinor: link.collectedOf(addOn.amount),
        addedAt: new Date(link.at),
      })
      .where(and(eq(overageAddOn.id, addOn.id), eq(overageAddOn.status, 'pending')))
      .returning({ id: overageAddOn.id });
    if (moved === undefined) throw new Error(`add-on ${addOn.id} moved while its link was raised`);
  }
}

/**
 * The add-ons a subscription's renewal link takes (`M12-11`): every `pending` one, by period, then
 * in the ledger's meter order. One still `added` to a mandate a re-pick cancelled goes back to
 * `pending` first: a row collected by link holds no live mandate.
 */
export async function addOnsForLink(
  tx: DbTransaction,
  subscription: { tenantId: string; subscriptionId: string },
): Promise<CollectedAddOn[]> {
  const ofSubscription = and(
    eq(overageAddOn.tenantId, subscription.tenantId),
    eq(overageAddOn.subscriptionId, subscription.subscriptionId),
  );
  await tx
    .update(overageAddOn)
    .set({ ...atNoGateway, status: 'pending', triedAt: null })
    .where(and(ofSubscription, eq(overageAddOn.status, 'added')));
  const rows = await tx
    .select({ id: overageAddOn.id, amount: overageAddOn.amountMinor })
    .from(overageAddOn)
    .where(and(ofSubscription, eq(overageAddOn.status, 'pending')))
    .orderBy(asc(overageAddOn.windowFrom), asc(overageAddOn.meter));
  return rows.map((row) => ({ id: row.id, amount: minorUnits(row.amount) }));
}
