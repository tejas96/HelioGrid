import type { Contact, ContactRoleSeed, Customer } from '@heliogrid/contracts';
import {
  contact,
  contactRoleLabel,
  customer,
  type DbTransaction,
  duplicateLink,
  lead,
  referral,
} from '@heliogrid/db';
import { and, asc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { leadScopeWhere } from './crm.scope.repository';
import type { LeadReader } from './internal/reader';

/*
 * A customer as their record shows it (`M02-34`, `M02-37`) and the contacts it lists — each other
 * customer it names named only to a reader whose scope reaches them. Each read takes the caller's
 * transaction and names its tenant in every query.
 */

/**
 * The names of those of these customers the reader's scope reaches — the `customerInScope` rule,
 * for many at once. A customer it does not reach is absent, so a record or an entry naming one
 * names it to no one who may not open it.
 */
export async function customerNamesInScope(
  tx: DbTransaction,
  reader: LeadReader,
  customerIds: readonly string[],
): Promise<ReadonlyMap<string, string | null>> {
  if (customerIds.length === 0) return new Map();
  const rows = await tx
    .selectDistinct({ id: customer.id, name: customer.name })
    .from(customer)
    .innerJoin(lead, and(eq(lead.customerId, customer.id), eq(lead.tenantId, customer.tenantId)))
    .where(
      and(
        eq(customer.tenantId, reader.tenantId),
        inArray(customer.id, [...new Set(customerIds)]),
        isNull(customer.mergedInto),
        leadScopeWhere(reader.scope, reader.actorId),
      ),
    );
  return new Map(rows.map((row) => [row.id, row.name]));
}

/** The columns a contact is read with; its role label joined. */
export const contactColumns = {
  id: contact.id,
  customerId: contact.customerId,
  name: contact.name,
  phoneE164: contact.phoneE164,
  roleId: contactRoleLabel.id,
  roleSeed: contactRoleLabel.seedKey,
  roleText: contactRoleLabel.label,
};

export function contactOf(row: {
  readonly id: string;
  readonly customerId: string;
  readonly name: string;
  readonly phoneE164: string;
  readonly roleId: string | null;
  readonly roleSeed: ContactRoleSeed | null;
  readonly roleText: string | null;
}): Contact {
  return {
    id: row.id,
    customerId: row.customerId,
    name: row.name,
    phoneE164: row.phoneE164,
    role: row.roleId === null ? null : { id: row.roleId, seed: row.roleSeed, text: row.roleText },
  };
}

const otherCustomer = alias(customer, 'other_customer');
const referredCustomer = alias(customer, 'referred_customer');

/**
 * A customer as their record shows it (`M02-34`, `M02-37`): contacts with their labels, the
 * duplicates kept beside them until a merge, and the leads they referred — each other customer
 * named only where the reader's scope reaches it. `null` when the company holds no such customer;
 * the caller has judged the reader's scope over this one.
 */
export async function customerRecordOf(
  tx: DbTransaction,
  reader: LeadReader,
  customerId: string,
): Promise<Customer | null> {
  const { tenantId } = reader;
  const [own] = await tx
    .select({
      id: customer.id,
      name: customer.name,
      phoneE164: customer.phoneE164,
      city: customer.city,
      preferredLanguage: customer.preferredLanguage,
      doNotCallSetAt: customer.doNotCallSetAt,
      wrongNumberAt: customer.wrongNumberAt,
      primaryContactId: customer.primaryContactId,
    })
    .from(customer)
    .where(and(eq(customer.tenantId, tenantId), eq(customer.id, customerId)));
  if (own === undefined) return null;
  const contacts = await tx
    .select(contactColumns)
    .from(contact)
    .leftJoin(
      contactRoleLabel,
      and(
        eq(contactRoleLabel.id, contact.roleLabelId),
        eq(contactRoleLabel.tenantId, contact.tenantId),
      ),
    )
    .where(and(eq(contact.tenantId, tenantId), eq(contact.customerId, customerId)))
    .orderBy(asc(contact.createdAt), asc(contact.id));
  const otherId = sql<string>`case when ${duplicateLink.customerAId} = ${customerId} then ${duplicateLink.customerBId} else ${duplicateLink.customerAId} end`;
  const kept = await tx
    .select({ customerId: otherCustomer.id, reason: duplicateLink.reason })
    .from(duplicateLink)
    .innerJoin(otherCustomer, sql`${otherCustomer.id} = ${otherId}`)
    .where(
      and(
        eq(duplicateLink.tenantId, tenantId),
        or(eq(duplicateLink.customerAId, customerId), eq(duplicateLink.customerBId, customerId)),
        isNull(duplicateLink.resolvedAt),
      ),
    )
    .orderBy(asc(duplicateLink.createdAt), asc(duplicateLink.id));
  const keptNames = await customerNamesInScope(
    tx,
    reader,
    kept.map((one) => one.customerId),
  );
  const referred = await tx
    .select({
      leadId: referral.referredLeadId,
      name: sql<
        string | null
      >`case when ${leadScopeWhere(reader.scope, reader.actorId)} then ${referredCustomer.name} end`,
    })
    .from(referral)
    .innerJoin(
      lead,
      and(eq(lead.id, referral.referredLeadId), eq(lead.tenantId, referral.tenantId)),
    )
    .innerJoin(referredCustomer, eq(referredCustomer.id, lead.customerId))
    .where(and(eq(referral.tenantId, tenantId), eq(referral.referringCustomerId, customerId)))
    .orderBy(asc(referral.createdAt), asc(referral.id));
  return {
    id: own.id,
    name: own.name,
    phoneE164: own.phoneE164,
    city: own.city,
    preferredLanguage: own.preferredLanguage,
    doNotCall: own.doNotCallSetAt !== null,
    wrongNumber: own.wrongNumberAt !== null,
    primaryContactId: own.primaryContactId,
    contacts: contacts.map(contactOf),
    keptDuplicates: kept.map((one) => ({ ...one, name: keptNames.get(one.customerId) ?? null })),
    referred,
  };
}
