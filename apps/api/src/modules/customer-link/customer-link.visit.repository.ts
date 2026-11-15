import {
  callbackRequest,
  contact,
  customer,
  customerLink,
  customerQuestion,
  type DbTransaction,
  lead,
  linkEvent,
} from '@heliogrid/db';
import {
  LINK_CEILINGS,
  type LinkServing,
  linkPhaseOf,
  linkServing,
  namedPersonOf,
} from '@heliogrid/domain';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { activeMemberOf } from '../crm/crm.public';
import { activeOwnersOf } from '../notification/notification.public';
import { type ServedVersion, servedVersionOf } from '../proposals/proposals.public';
import type {
  CustomerProjectsRegistry,
  ProjectPhaseFacts,
} from './customer-link.projects.repository';
import type { PresentedToken } from './customer-link.token.admin.repository';

/*
 * What the server knows when a token is presented (`F5-19`, `F5-21`, `F5-25`), read on the
 * company's own transaction: the link, its deal as it stands now — the phase is the deal's state,
 * never stored — the version it serves, the trailing-hour counts of the link's own rows (`F5-78`),
 * and the person the page names. Billing state and money owed are not read here at all (`F5-23`,
 * `F5-24`).
 */

const MS_PER_MINUTE = 60_000;
const ANSWERS = ['accepted', 'negotiate_requested', 'declined'] as const;

/** The person a page names, and the work a customer's act goes to (`F5-55`). */
export interface NamedMember {
  readonly userId: string;
  readonly name: string;
  readonly phoneE164: string;
}

export interface LinkVisit {
  readonly tenantId: string;
  readonly linkId: string;
  readonly tokenId: string;
  readonly leadId: string;
  readonly customerId: string;
  readonly label: string;
  readonly contactId: string | null;
  readonly contactName: string | null;
  readonly customerName: string | null;
  readonly customerPhoneE164: string;
  readonly preferredLanguage: typeof customer.$inferSelect.preferredLanguage;
  readonly project: ProjectPhaseFacts | null;
  readonly served: ServedVersion | null;
  readonly serving: LinkServing;
  /** Respond acts sent from this link in the trailing window: answers, questions and call requests. */
  readonly respondsInWindow: number;
  readonly person: NamedMember | null;
}

const countOf = async (query: PromiseLike<{ n: number }[]>): Promise<number> =>
  (await query)[0]?.n ?? 0;

/** The link's own rows in the trailing window: opens, and every respond act it carried. */
async function windowCounts(tx: DbTransaction, tenantId: string, linkId: string, now: number) {
  const since = new Date(now - LINK_CEILINGS.windowMinutes * MS_PER_MINUTE);
  const n = sql<number>`count(*)::int`;
  const events = (types: readonly (typeof linkEvent.$inferSelect.eventType)[]) =>
    countOf(
      tx
        .select({ n })
        .from(linkEvent)
        .where(
          and(
            eq(linkEvent.tenantId, tenantId),
            eq(linkEvent.linkId, linkId),
            inArray(linkEvent.eventType, [...types]),
            gte(linkEvent.occurredAt, since),
          ),
        ),
    );
  const [opens, answers, questions, calls] = await Promise.all([
    events(['opened']),
    events(ANSWERS),
    countOf(
      tx
        .select({ n })
        .from(customerQuestion)
        .where(
          and(
            eq(customerQuestion.tenantId, tenantId),
            eq(customerQuestion.linkId, linkId),
            gte(customerQuestion.askedAt, since),
          ),
        ),
    ),
    countOf(
      tx
        .select({ n })
        .from(callbackRequest)
        .where(
          and(
            eq(callbackRequest.tenantId, tenantId),
            eq(callbackRequest.linkId, linkId),
            gte(callbackRequest.requestedAt, since),
          ),
        ),
    ),
  ]);
  return { opens, responds: answers + questions + calls };
}

/**
 * The person the page names and a customer's act goes to (`F5-55`, `T-F5-001`): the lead's owner —
 * the project's manager once the deal is won — then whoever minted the link, then an EPC Owner,
 * active members only. `null` only where the company has no active member left to name.
 */
async function namedMemberOf(
  tx: DbTransaction,
  tenantId: string,
  facts: {
    readonly leadOwnerId: string | null;
    readonly project: ProjectPhaseFacts | null;
    readonly minterId: string;
  },
): Promise<NamedMember | null> {
  const owners = (await activeOwnersOf(tx, tenantId)).map((owner) => owner.userId);
  const named = [facts.leadOwnerId, facts.project?.managerId ?? null, facts.minterId].filter(
    (id): id is string => id !== null,
  );
  const active = new Set(owners);
  for (const id of new Set(named)) {
    if ((await activeMemberOf(tx, tenantId, id)) !== null) active.add(id);
  }
  const userId = namedPersonOf({
    phase: linkPhaseOf(facts.project?.stage ?? null),
    leadOwnerId: facts.leadOwnerId,
    projectManagerId: facts.project?.managerId ?? null,
    minterId: facts.minterId,
    epcOwnerIds: owners,
    activeIds: active,
  });
  const member = userId === null ? null : await activeMemberOf(tx, tenantId, userId);
  return member === null
    ? null
    : { userId: member.userId, name: member.name ?? '', phoneE164: member.phoneE164 };
}

/** Everything a presented token's request reads of its link and deal; `null` for a link gone. */
export async function visitOf(
  tx: DbTransaction,
  token: PresentedToken,
  projects: CustomerProjectsRegistry,
  now: number,
): Promise<LinkVisit | null> {
  const { tenantId, linkId } = token;
  const [row] = await tx
    .select({
      leadId: customerLink.leadId,
      label: customerLink.label,
      status: customerLink.status,
      scopes: customerLink.scopes,
      mintedBy: customerLink.mintedBy,
      contactId: customerLink.contactId,
      contactName: contact.name,
      customerId: lead.customerId,
      leadState: lead.lifecycleState,
      leadOwnerId: lead.ownerUserId,
      customerName: customer.name,
      customerPhoneE164: customer.phoneE164,
      preferredLanguage: customer.preferredLanguage,
    })
    .from(customerLink)
    .innerJoin(
      lead,
      and(eq(lead.tenantId, customerLink.tenantId), eq(lead.id, customerLink.leadId)),
    )
    .innerJoin(
      customer,
      and(eq(customer.tenantId, lead.tenantId), eq(customer.id, lead.customerId)),
    )
    .leftJoin(
      contact,
      and(eq(contact.tenantId, customerLink.tenantId), eq(contact.id, customerLink.contactId)),
    )
    .where(and(eq(customerLink.tenantId, tenantId), eq(customerLink.id, linkId)));
  if (row === undefined) return null;
  const [counts, project, served] = await Promise.all([
    windowCounts(tx, tenantId, linkId, now),
    projects.phaseFactsOf(tx, tenantId, row.leadId),
    servedVersionOf(tx, tenantId, row.leadId),
  ]);
  const serving = linkServing({
    link: { status: row.status, tokenRevoked: token.revoked, scopes: row.scopes },
    viewsInWindow: counts.opens,
    leadState: row.leadState,
    projectStage: project?.stage ?? null,
    proposalStatus: served?.status ?? null,
  });
  return {
    tenantId,
    linkId,
    tokenId: token.tokenId,
    leadId: row.leadId,
    customerId: row.customerId,
    label: row.label,
    contactId: row.contactId,
    contactName: row.contactName,
    customerName: row.customerName,
    customerPhoneE164: row.customerPhoneE164,
    preferredLanguage: row.preferredLanguage,
    project,
    served,
    serving,
    respondsInWindow: counts.responds,
    person: await namedMemberOf(tx, tenantId, {
      leadOwnerId: row.leadOwnerId,
      project,
      minterId: row.mintedBy,
    }),
  };
}

/** Whether `userId` is an active member of the company — whichever company they act under now. */
export async function isCompanyMember(
  tx: DbTransaction,
  tenantId: string,
  userId: string,
): Promise<boolean> {
  return (await activeMemberOf(tx, tenantId, userId)) !== null;
}
