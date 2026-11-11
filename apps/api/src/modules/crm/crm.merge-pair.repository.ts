import type { MergePreview } from '@heliogrid/contracts';
import {
  activity,
  contact,
  customer,
  type DbTransaction,
  lead,
  leadFile,
  leadVisitBooking,
  referral,
  task,
} from '@heliogrid/db';
import type { MergeCustomer } from '@heliogrid/domain';
import { and, asc, count, eq, inArray, or, type SQL } from 'drizzle-orm';
import { customerIdsOf, customerInScope, lockCustomers } from './crm.customers.repository';
import { leadOwner, memberNameOf } from './crm.lead-columns.repository';
import { CURRENT_LEAD_FIRST } from './crm.sheet-facts.repository';
import type { LeadReader } from './internal/reader';

/*
 * The two customers a merge names, as domain's `merge-plan.ts` compares them, and what would move
 * from the loser to the survivor (`M02-63`). Each read takes the caller's transaction and names its
 * tenant in every query.
 */

/** Why the two cannot merge — the preview's `blocked` and the merge's 409s. */
export type MergeBlock = NonNullable<MergePreview['blocked']>;

/** A merge customer as read, with what the compare step shows of its primary contact. */
export interface MergeSideRow extends MergeCustomer {
  /** The stored name, `null` where none was typed (domain compares it as blank). */
  readonly storedName: string | null;
  /** The primary contact's name; `null` where the customer is their own primary. */
  readonly primaryContactName: string | null;
}

export type MergePairRead =
  | { readonly kind: 'not-found' }
  | { readonly kind: 'blocked'; readonly block: MergeBlock; readonly heldBy: string | null }
  | { readonly kind: 'pair'; readonly survivor: MergeSideRow; readonly loser: MergeSideRow };

/**
 * Both customers, or why they cannot merge: either missing from the company is not found; either
 * already a tombstone is `already_merged`; either outside the reader's lead scope is `out_of_scope`
 * (`M02-63`). With `lock`, both are held with their leads (`lockCustomers`) before they are read,
 * so two merges of one customer queue rather than both pass.
 */
export async function mergePairOf(
  tx: DbTransaction,
  reader: LeadReader,
  pair: { readonly survivorId: string; readonly loserId: string },
  lock: boolean,
): Promise<MergePairRead> {
  const { tenantId } = reader;
  if (lock) await lockCustomers(tx, tenantId, [pair.survivorId, pair.loserId]);
  const rows = await tx
    .select({
      customerId: customer.id,
      storedName: customer.name,
      city: customer.city,
      phoneE164: customer.phoneE164,
      primaryContactId: customer.primaryContactId,
      mergedInto: customer.mergedInto,
    })
    .from(customer)
    .where(
      and(eq(customer.tenantId, tenantId), inArray(customer.id, [pair.survivorId, pair.loserId])),
    );
  const survivorRow = rows.find((row) => row.customerId === pair.survivorId);
  const loserRow = rows.find((row) => row.customerId === pair.loserId);
  if (survivorRow === undefined || loserRow === undefined) return { kind: 'not-found' };
  if (survivorRow.mergedInto !== null || loserRow.mergedInto !== null) {
    return { kind: 'blocked', block: 'already_merged', heldBy: null };
  }
  const outside = await outOfScopeOf(tx, reader, [pair.survivorId, pair.loserId]);
  if (outside !== null) {
    return {
      kind: 'blocked',
      block: 'out_of_scope',
      heldBy: await holderOf(tx, tenantId, outside),
    };
  }
  const contacts = await tx
    .select({
      contactId: contact.id,
      customerId: contact.customerId,
      name: contact.name,
      phoneE164: contact.phoneE164,
    })
    .from(contact)
    .where(
      and(
        eq(contact.tenantId, tenantId),
        inArray(contact.customerId, [pair.survivorId, pair.loserId]),
      ),
    )
    .orderBy(asc(contact.createdAt), asc(contact.id));
  const sideOf = (row: typeof survivorRow): MergeSideRow => {
    const own = contacts.filter((one) => one.customerId === row.customerId);
    return {
      ...row,
      name: row.storedName ?? '',
      contacts: own.map(({ contactId, phoneE164 }) => ({ contactId, phoneE164 })),
      primaryContactName: own.find((one) => one.contactId === row.primaryContactId)?.name ?? null,
    };
  };
  return { kind: 'pair', survivor: sideOf(survivorRow), loser: sideOf(loserRow) };
}

/** The first of these customers outside the reader's lead scope, or `null` when both are in it. */
async function outOfScopeOf(
  tx: DbTransaction,
  reader: LeadReader,
  customerIds: readonly string[],
): Promise<string | null> {
  for (const customerId of customerIds) {
    if (!(await customerInScope(tx, reader, customerId))) return customerId;
  }
  return null;
}

/**
 * Who holds a customer the reader cannot see: the owner of the lead that stands for them, by name —
 * a record outside the scope shows its owner and never its contents (`M02-08`); `null` while that
 * lead waits unassigned.
 */
async function holderOf(
  tx: DbTransaction,
  tenantId: string,
  customerId: string,
): Promise<string | null> {
  const [held] = await tx
    .select({ name: memberNameOf(leadOwner) })
    .from(lead)
    .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
    .where(and(eq(lead.tenantId, tenantId), eq(lead.customerId, customerId)))
    .orderBy(...CURRENT_LEAD_FIRST)
    .limit(1);
  return held?.name ?? null;
}

/** What re-points from the loser, counted (`M02-63`: the confirm step says what moves). */
export async function mergeMovesOf(
  tx: DbTransaction,
  tenantId: string,
  loserId: string,
): Promise<NonNullable<MergePreview['moves']>> {
  const leadIds = tx
    .select({ id: lead.id })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.customerId, loserId)));
  const countOf = async (
    table: typeof contact | typeof lead | typeof activity | typeof referral,
    where: SQL | undefined,
  ) => (await tx.select({ n: count() }).from(table).where(where))[0]?.n ?? 0;
  const onLoserLeads = async (table: typeof leadVisitBooking | typeof task) =>
    (
      await tx
        .select({ n: count() })
        .from(table)
        .where(and(eq(table.tenantId, tenantId), inArray(table.leadId, leadIds)))
    )[0]?.n ?? 0;
  // The files the lead lists (`M02-32`) — never an upload that was not put on it.
  const [files] = await tx
    .select({ n: count() })
    .from(leadFile)
    .where(and(eq(leadFile.tenantId, tenantId), inArray(leadFile.leadId, leadIds)));
  return {
    contacts: await countOf(
      contact,
      and(eq(contact.tenantId, tenantId), eq(contact.customerId, loserId)),
    ),
    leads: await countOf(lead, and(eq(lead.tenantId, tenantId), eq(lead.customerId, loserId))),
    activities: await countOf(
      activity,
      and(
        eq(activity.tenantId, tenantId),
        inArray(activity.customerId, await customerIdsOf(tx, tenantId, loserId)),
      ),
    ),
    referrals: await countOf(
      referral,
      and(
        eq(referral.tenantId, tenantId),
        or(eq(referral.referringCustomerId, loserId), inArray(referral.referredLeadId, leadIds)),
      ),
    ),
    visits: await onLoserLeads(leadVisitBooking),
    tasks: await onLoserLeads(task),
    files: files?.n ?? 0,
  };
}
