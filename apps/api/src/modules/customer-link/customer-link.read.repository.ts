import type { CustomerLink } from '@heliogrid/contracts';
import {
  contact,
  customerLink,
  type DbTransaction,
  lead,
  linkEvent,
  userAccount,
} from '@heliogrid/db';
import { and, asc, eq, sql } from 'drizzle-orm';
import { findLeadInScope, type LeadReader, memberNameOf, memberRefOf } from '../crm/crm.public';
import { servedVersionOf } from '../proposals/proposals.public';
import type { LinkedLead } from './customer-link.mint.repository';
import type { CustomerProjectsRegistry } from './customer-link.projects.repository';

/*
 * A deal's links as the company reads them (`F5-26`, `F5-27`, `F5-30`): each with who it is for,
 * its state, and the opens attributed to it. A link's address is never read here — it is the key.
 */

/**
 * The lead a member may work links on: one their own lead reads reach, or — once the deal is won —
 * the project they manage (`T-M06-020`: a customer who loses their phone mid-install is served by
 * the person they deal with). Anything else answers `null`, as another company's does.
 */
export async function leadInReach(
  tx: DbTransaction,
  reader: LeadReader,
  leadId: string,
  projects: CustomerProjectsRegistry,
): Promise<LinkedLead | null> {
  const { tenantId } = reader;
  const own = await findLeadInScope(tx, reader, leadId);
  if (own !== null) return { tenantId, leadId, customerId: own.customerId };
  const project = await projects.phaseFactsOf(tx, tenantId, leadId);
  if (project === null || project.managerId !== reader.actorId) return null;
  const [managed] = await tx
    .select({ customerId: lead.customerId })
    .from(lead)
    .where(and(eq(lead.tenantId, tenantId), eq(lead.id, leadId)));
  return managed === undefined ? null : { tenantId, leadId, customerId: managed.customerId };
}

const opens = sql<number>`(select count(*)::int from ${linkEvent} where ${linkEvent.tenantId} = ${customerLink.tenantId} and ${linkEvent.linkId} = ${customerLink.id} and ${linkEvent.eventType} = 'opened')`;
const lastOpen = (column: 'occurred_at' | 'device_class') =>
  sql`(select ${sql.raw(column)} from ${linkEvent} where ${linkEvent.tenantId} = ${customerLink.tenantId} and ${linkEvent.linkId} = ${customerLink.id} and ${linkEvent.eventType} = 'opened' order by ${linkEvent.occurredAt} desc limit 1)`;
const answeredOn = (version: number | null) =>
  version === null
    ? sql<boolean>`false`
    : sql<boolean>`exists (select 1 from ${linkEvent} where ${linkEvent.tenantId} = ${customerLink.tenantId} and ${linkEvent.linkId} = ${customerLink.id} and ${linkEvent.eventType} in ('accepted', 'negotiate_requested', 'declined') and ${linkEvent.proposalVersion} = ${version})`;

type LinkRow = Awaited<ReturnType<typeof linkRows>>[number];

function linkRows(
  tx: DbTransaction,
  tenantId: string,
  where: ReturnType<typeof eq>,
  version: number | null,
) {
  return tx
    .select({
      id: customerLink.id,
      leadId: customerLink.leadId,
      label: customerLink.label,
      contactId: customerLink.contactId,
      contactName: contact.name,
      status: customerLink.status,
      mintedAt: customerLink.mintedAt,
      mintedBy: customerLink.mintedBy,
      minterName: memberNameOf(userAccount),
      revokedAt: customerLink.revokedAt,
      opens,
      lastOpenedAt: lastOpen('occurred_at').mapWith(customerLink.mintedAt),
      lastDeviceClass: lastOpen('device_class').mapWith(linkEvent.deviceClass),
      answered: answeredOn(version),
    })
    .from(customerLink)
    .leftJoin(
      contact,
      and(eq(contact.tenantId, customerLink.tenantId), eq(contact.id, customerLink.contactId)),
    )
    .leftJoin(userAccount, eq(userAccount.id, customerLink.mintedBy))
    .where(and(eq(customerLink.tenantId, tenantId), where))
    .orderBy(asc(customerLink.mintedAt), asc(customerLink.id));
}

function linkWire(row: LinkRow): CustomerLink {
  return {
    id: row.id,
    label: row.label,
    contact: row.contactId === null ? null : { id: row.contactId, name: row.contactName ?? '' },
    status: row.status,
    mintedAt: row.mintedAt.toISOString(),
    mintedBy: memberRefOf(row.mintedBy, row.minterName),
    opens: row.opens,
    lastOpenedAt: row.lastOpenedAt?.toISOString() ?? null,
    lastDeviceClass: row.lastDeviceClass ?? null,
    answered: row.answered,
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

/** The version the lead's link serves now, which `answered` is read against; `null` for none. */
async function servedVersionNumber(tx: DbTransaction, tenantId: string, leadId: string) {
  return (await servedVersionOf(tx, tenantId, leadId))?.version ?? null;
}

/** Every link of a lead, oldest first. */
export async function linksOfLead(
  tx: DbTransaction,
  tenantId: string,
  leadId: string,
): Promise<CustomerLink[]> {
  const version = await servedVersionNumber(tx, tenantId, leadId);
  const rows = await linkRows(tx, tenantId, eq(customerLink.leadId, leadId), version);
  return rows.map(linkWire);
}

/** One link as the wire reads it, with the lead it is on; `null` where the company holds no such link. */
export async function linkById(
  tx: DbTransaction,
  tenantId: string,
  linkId: string,
): Promise<{ readonly link: CustomerLink; readonly leadId: string } | null> {
  const [found] = await tx
    .select({ leadId: customerLink.leadId })
    .from(customerLink)
    .where(and(eq(customerLink.tenantId, tenantId), eq(customerLink.id, linkId)));
  if (found === undefined) return null;
  const version = await servedVersionNumber(tx, tenantId, found.leadId);
  const [row] = await linkRows(tx, tenantId, eq(customerLink.id, linkId), version);
  return row === undefined ? null : { link: linkWire(row), leadId: found.leadId };
}

/** The contacts of the lead's customer — who a new link can be named for (`F5-26`). */
export function contactsOf(tx: DbTransaction, tenantId: string, customerId: string) {
  return tx
    .select({ id: contact.id, name: contact.name })
    .from(contact)
    .where(and(eq(contact.tenantId, tenantId), eq(contact.customerId, customerId)))
    .orderBy(asc(contact.name), asc(contact.id));
}
