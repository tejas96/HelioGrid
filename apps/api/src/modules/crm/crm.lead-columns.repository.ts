import { customer, lead, userAccount } from '@heliogrid/db';
import { type AnyColumn, and, eq, type SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

/*
 * The pieces every lead read is built from: its customer's join, its owner's, and the columns a lead
 * summary is read with (mapped to the wire by `internal/lead-wire.ts`).
 */

/** The lead's owner, as a second `user_account` beside any other a query joins. */
export const leadOwner = alias(userAccount, 'lead_owner');

/**
 * How a member reads on a CRM record: their name, else their number — never blank. `null` only
 * where the account is left-joined and absent.
 */
export function memberNameOf(account: {
  name: AnyColumn;
  phoneE164: AnyColumn;
}): SQL<string | null> {
  return sql<string | null>`coalesce(${account.name}, ${account.phoneE164})`;
}

/** The lead's customer, in the lead's own company — the join every lead read makes. */
export const leadCustomerJoin = and(
  eq(customer.id, lead.customerId),
  eq(customer.tenantId, lead.tenantId),
);

/** The columns a lead summary is made of: `from lead`, its customer joined, its owner left-joined. */
export const leadSummaryColumns = {
  id: lead.id,
  customerId: lead.customerId,
  name: customer.name,
  phoneE164: customer.phoneE164,
  city: customer.city,
  segment: lead.segment,
  source: lead.source,
  stage: lead.stage,
  state: lead.lifecycleState,
  ownerId: lead.ownerUserId,
  ownerName: memberNameOf(leadOwner),
  monthlyBillMinor: lead.monthlyBillMinor,
  createdAt: lead.createdAt,
  lastActivityAt: lead.lastActivityAt,
};
