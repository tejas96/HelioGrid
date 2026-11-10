import type { DedupeMatchWire } from '@heliogrid/contracts';
import { customer, type DbTransaction, lead } from '@heliogrid/db';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { leadCustomerJoin, leadOwner } from './crm.lead-columns.repository';
import { leadScopeWhere } from './crm.scope.repository';
import {
  CURRENT_LEAD_FIRST,
  holdersOf,
  sheetFactColumns,
  sheetFactsOf,
} from './crm.sheet-facts.repository';
import { phoneLockKey } from './internal/phone-lock';
import type { LeadReader } from './internal/reader';

/*
 * The customer reads and locks the CRM's slices share (`M02-02`, `M02-60`): who a number belongs
 * to, which customers a stream reads through the merge tombstone, whether a reader may see one, and
 * the one order a write holds them in. Each takes the caller's transaction and names its tenant in
 * every query. A customer as its record shows it is `crm.customer-record.repository.ts`'s.
 */

/**
 * The survivor and every customer merged into it, at any depth — a chain of merges reads as one
 * stream. A customer nobody merged into is its own one-item list.
 */
export async function customerIdsOf(
  tx: DbTransaction,
  tenantId: string,
  survivorId: string,
): Promise<string[]> {
  const rows = await tx.execute<{ id: string }>(sql`
    with recursive merged(id) as (
      select ${customer.id} from ${customer}
      where ${customer.tenantId} = ${tenantId} and ${customer.id} = ${survivorId}
      union
      select c.id from ${customer} c join merged m on c.merged_into = m.id
      where c.tenant_id = ${tenantId}
    )
    select id from merged`);
  return rows.map((row) => row.id);
}

/**
 * Queues this save behind any other of the same number in the company until the transaction ends
 * (`M02-66`): the re-check and the insert that follow it see the first save's record.
 */
export async function lockPhone(
  tx: DbTransaction,
  tenantId: string,
  phoneE164: string,
): Promise<void> {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${phoneLockKey(tenantId, phoneE164)}))`,
  );
}

/**
 * Holds these customers until the transaction ends — their leads first, then the customers, each
 * in id order, the one order every write takes (`lockLead`) — so a write naming a customer queues
 * behind a merge of it: the `customerInScope` that follows reads it merged, and nothing lands on
 * the tombstone (`M02-60`). A save of a number takes `lockPhone` first, as every capture does, or
 * the two locks could be taken in opposite orders. Neither lock blocks a row that merely names one
 * of these (a timeline entry, a task): only writes to the lead or the customer itself queue.
 *
 * The leads are taken again until no new one appears: a merge into one of these customers that
 * committed while the first pass waited moved in leads that pass could not see, and a merge of
 * that customer away would re-point them unheld — waiting on an edit that holds one and waits, in
 * turn, on the customer this write already holds.
 */
export async function lockCustomers(
  tx: DbTransaction,
  tenantId: string,
  customerIds: readonly string[],
): Promise<void> {
  if (customerIds.length === 0) return;
  const held = new Set<string>();
  for (;;) {
    const leads = await tx
      .select({ id: lead.id })
      .from(lead)
      .where(and(eq(lead.tenantId, tenantId), inArray(lead.customerId, [...customerIds])))
      .orderBy(asc(lead.id))
      .for('no key update');
    const unseen = leads.filter((one) => !held.has(one.id));
    if (unseen.length === 0) break;
    for (const one of unseen) held.add(one.id);
  }
  await tx
    .select({ id: customer.id })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), inArray(customer.id, [...customerIds])))
    .orderBy(asc(customer.id))
    .for('no key update');
}

/** What a number already belongs to: the record the sheet shows, and every customer that holds it. */
export interface PhoneMatch {
  readonly facts: DedupeMatchWire;
  readonly customerIds: readonly string[];
}

/**
 * The customer or contact a pack-normalised number already belongs to (`M02-07`), as the dedupe
 * sheet shows it to this reader: the record in their scope, or its three facts only (`M02-08`,
 * domain's `dedupeSheetOf`). `null` when the number is nobody's.
 */
export async function phoneMatchOf(
  tx: DbTransaction,
  reader: LeadReader,
  phoneE164: string,
): Promise<PhoneMatch | null> {
  const holders = sql`(select customer_id from ${holdersOf(reader.tenantId, [phoneE164])} held)`;
  const rows = await tx
    .select(sheetFactColumns(reader))
    .from(lead)
    .innerJoin(customer, leadCustomerJoin)
    .leftJoin(leadOwner, eq(leadOwner.id, lead.ownerUserId))
    .where(and(eq(lead.tenantId, reader.tenantId), sql`${lead.customerId} in ${holders}`))
    .orderBy(...CURRENT_LEAD_FIRST);
  const [top] = rows;
  if (top === undefined) return null;
  return {
    facts: sheetFactsOf(top, reader),
    customerIds: [...new Set(rows.map((row) => row.customerId))],
  };
}

/** A customer this reader may see: one not merged away, with a lead in their scope. */
export async function customerInScope(
  tx: DbTransaction,
  reader: LeadReader,
  customerId: string,
): Promise<boolean> {
  const [found] = await tx
    .select({ id: customer.id })
    .from(customer)
    .innerJoin(lead, and(eq(lead.customerId, customer.id), eq(lead.tenantId, customer.tenantId)))
    .where(
      and(
        eq(customer.tenantId, reader.tenantId),
        eq(customer.id, customerId),
        isNull(customer.mergedInto),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    )
    .limit(1);
  return found !== undefined;
}

/** The lead that stands for a customer — open before closed, then newest — or `null` for none. */
export async function currentLeadOf(
  tx: DbTransaction,
  tenantId: string,
  customerId: string,
): Promise<string | null> {
  const [current] = await tx
    .select({ id: lead.id })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.customerId, customerId)))
    .orderBy(...CURRENT_LEAD_FIRST)
    .limit(1);
  return current?.id ?? null;
}
