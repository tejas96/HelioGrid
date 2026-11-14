import type { CustomerLink, CustomerLinks, CustomerPage, LeadDetail } from '@heliogrid/contracts';
import { customerLink, linkEvent, linkToken } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  CustomerProjectsRegistry,
  type ProjectPhaseFacts,
} from '../../src/modules/customer-link/customer-link.public';
import { PublicCeiling } from '../../src/modules/customer-link/internal/public-ceiling';
import type { Caller } from '../crm/support';
import type { ProposalsWorld } from '../proposals/support';
import type { Reply } from '../support/http';

export * from '../proposals/support';
/** A fresh number no other record holds. */
export { aPhone as aPhoneNumber } from '../support/fixture';

/*
 * The customer's side of a proof: a link's address read as a person copies it, then the page and
 * its acts called with no session at all — what the customer's own phone sends.
 */

export interface AddressedLink {
  readonly link: CustomerLink;
  readonly url: string;
}

/** The token an address ends with — the customer's whole authority. */
export const tokenOf = (url: string): string => url.slice(url.lastIndexOf('/') + 1);

export function linksOf(caller: Caller, leadId: string) {
  return caller.call<CustomerLinks>('GET', `/leads/${leadId}/links`);
}

/** The customer's own link on a shared lead, with its token. */
export async function customersLink(
  caller: Caller,
  leadId: string,
): Promise<{ readonly link: CustomerLink; readonly token: string }> {
  const listed = await linksOf(caller, leadId);
  const own = listed.body.links?.find((link) => link.contact === null && link.status === 'active');
  if (own === undefined) throw new Error(`lead ${leadId} holds no customer link`);
  const address = await caller.call<AddressedLink>('POST', `/links/${own.id}/address`, {
    capturedAt: new Date().toISOString(),
  });
  if (address.status !== HttpStatus.OK) throw new Error(`address: got ${address.status}`);
  return { link: own, token: tokenOf(address.body.url) };
}

/** The page as the customer's browser reads it: no session, no cookie. */
export function pageOf(world: ProposalsWorld, token: string): Promise<Reply<CustomerPage>> {
  return world.http.callAnonymously<CustomerPage>('GET', `/customer-link/${token}`);
}

/** One act from the customer's page, with no session. */
export function linkAct<T = CustomerPage>(
  world: ProposalsWorld,
  token: string,
  act: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<Reply<T>> {
  return world.http.callAnonymously<T>('POST', `/customer-link/${token}/${act}`, body, headers);
}

/** What an answer names: the version the customer's page serves right now, by id (`F5-47`). */
export async function answerOn(
  world: ProposalsWorld,
  token: string,
): Promise<{ readonly versionId: string }> {
  const versionId = (await pageOf(world, token)).body.proposal?.versionId;
  if (versionId === undefined) throw new Error('the page serves no proposal version');
  return { versionId };
}

/** An answer where the link refuses before any version is read: off, unknown or over its ceiling. */
export const anyVersion = { versionId: '018f0000-0000-7000-8000-0000000000aa' } as const;

export const customerOf = async (caller: Caller, leadId: string) =>
  (await caller.call<LeadDetail>('GET', `/leads/${leadId}`)).body.customer;

/** A link's events in the order they happened: two in one millisecond keep their id's order. */
export const eventsOf = (world: ProposalsWorld, linkId: string) =>
  world.pools.admin.db
    .select()
    .from(linkEvent)
    .where(eq(linkEvent.linkId, linkId))
    .orderBy(asc(linkEvent.occurredAt), asc(linkEvent.id));

export const tokensOf = (world: ProposalsWorld, linkId: string) =>
  world.pools.admin.db.select().from(linkToken).where(eq(linkToken.linkId, linkId));

export const linkRowsOf = (world: ProposalsWorld, leadId: string) =>
  world.pools.admin.db.select().from(customerLink).where(eq(customerLink.leadId, leadId));

/** The process's own public ceiling, emptied — a proof never inherits another's count. */
export const publicCeilingOf = (world: ProposalsWorld) => world.http.app.get(PublicCeiling);

/**
 * A won deal as the link reads it, without the projects module: the phase facts a proof states,
 * for the leads it names. Every other lead reads as still in its proposal phase.
 */
export function projectsStandIn(world: ProposalsWorld, won: Map<string, ProjectPhaseFacts>): void {
  world.http.app.get(CustomerProjectsRegistry).register({
    phaseFactsOf: async (_tx, _tenantId, leadId) => won.get(leadId) ?? null,
    progressOf: async () => null,
    solarFileOf: async () => null,
    customerFile: async () => null,
  });
}
