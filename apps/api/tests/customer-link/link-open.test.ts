import { linkEvent, proposal } from '@heliogrid/db';
import { FOUNDER_ROLE, LINK_CEILINGS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { noticesOf } from '../crm/support';
import { aMembership, skipWithoutDatabase } from '../support/fixture';
import {
  aLead,
  anyVersion,
  aShared,
  aStaffedCompany,
  auditEntriesOf,
  customersLink,
  eventsOf,
  linkAct,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  pageOf,
  preset,
  publicCeilingOf,
  refusalOf,
  storedEntriesOf,
} from './support';

/**
 * Opens, ceilings and the honest page (`T-F5-007`, `T-F5-004`; `F5-25`, `F5-27`…`F5-29`, `F5-78`):
 * an open is the link, the moment and a device class; a link over its ceiling, turned off or with
 * no live proposal answers a page that names a person and nothing of the customer.
 */

const here = aStaffedCompany('Link Opens EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});
/**
 * A customer who also works at another company on the product: still the customer here. Its
 * `seller` is `here`'s seller too, signed in under this other company.
 */
const other = aStaffedCompany('Link Opens Other EPC', { owner: [FOUNDER_ROLE] });
const elsewhere = {
  ...other,
  members: {
    ...other.members,
    seller: aMembership(other.company, here.people.seller, [preset.sales_executive]),
  },
};

const skip = skipWithoutDatabase(
  'CUSTOMER LINK OPENS PROOF',
  'Open attribution, the ceilings and the link-off page are UNPROVEN in this run.',
);

const at = () => new Date().toISOString();
/** An address the proofs never call from: the test client is another. */
const FLOODING_ADDRESS = '203.0.113.7';

describe.skipIf(skip)('Opens and the link-off page, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const sellerId = () => here.people.seller.userId;
  const db = () => world.pools.admin.db;

  const aSharedDeal = async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, sellerId());
    const shared = await aShared(owner(), leadId);
    const { link, token } = await customersLink(owner(), leadId);
    return { leadId, proposalId: shared.id, link, token };
  };
  const opened = (token: string, deviceClass = 'phone') =>
    linkAct<null>(world, token, 'opened', { deviceClass });

  beforeAll(async () => {
    world = await openProposalsWorld([here, elsewhere]);
  });

  afterAll(async () => {
    publicCeilingOf(world).reset();
    await world.close();
  });

  it('an open records the link, the moment and a device class — and the first one tells the rep (F5-27, F5-29, M06-54)', async () => {
    const deal = await aSharedDeal();
    expect((await opened(deal.token)).status).toBe(HttpStatus.NO_CONTENT);
    expect((await opened(deal.token, 'desktop')).status).toBe(HttpStatus.NO_CONTENT);

    const events = await eventsOf(world, deal.link.id);
    expect(events.map((event) => [event.eventType, event.deviceClass])).toEqual([
      ['opened', 'phone'],
      ['opened', 'desktop'],
    ]);
    // All an open holds (`F5-29`): no column for an address, an agent or a person exists to fill.
    expect(Object.keys(events[0] ?? {}).sort()).toEqual(
      [
        'deviceClass',
        'durationSeconds',
        'eventType',
        'id',
        'linkId',
        'occurredAt',
        'proposalVersion',
        'section',
        'tenantId',
        'words',
      ].sort(),
    );
    const [stamped] = await db()
      .select({ openedAt: proposal.openedAt })
      .from(proposal)
      .where(eq(proposal.id, deal.proposalId));
    expect(stamped?.openedAt).not.toBeNull();
    expect(await noticesOf(world, sellerId(), deal.proposalId)).toMatchObject([
      { type: 'proposal_opened' },
    ]);
    const entries = await storedEntriesOf(world, deal.leadId);
    expect(entries.filter((entry) => entry.kind === 'proposal_opened')).toHaveLength(1);
    const audited = await auditEntriesOf(world, here.company.tenantId, 'customer_link.opened');
    expect(audited.filter((entry) => entry.subjectRef === deal.link.id)).toMatchObject([
      { actorKind: 'customer_link', actorRef: deal.link.id },
      { actorKind: 'customer_link', actorRef: deal.link.id },
    ]);
    // The company reads its own log back, the customer's acts included (`F5-79`).
    const log = await owner().call<{ items: { actorKind: string }[] }>(
      'GET',
      '/tenants/me/audit-log',
    );
    expect(log.status).toBe(HttpStatus.OK);
    expect(log.body.items.some((entry) => entry.actorKind === 'customer_link')).toBe(true);
  });

  it('a company’s own member looking at the page is never an open (T-F5-007)', async () => {
    const deal = await aSharedDeal();
    const byRep = await world
      .as(here.members.seller)
      .call('POST', `/customer-link/${deal.token}/opened`, { deviceClass: 'desktop' });
    expect(byRep.status).toBe(HttpStatus.NO_CONTENT);
    // Signed in under another company they also work for, they are still the company's own.
    const underOther = await world
      .as(elsewhere.members.seller)
      .call('POST', `/customer-link/${deal.token}/opened`, { deviceClass: 'phone' });
    expect(underOther.status).toBe(HttpStatus.NO_CONTENT);
    expect(await eventsOf(world, deal.link.id)).toEqual([]);
    expect(await noticesOf(world, sellerId(), deal.proposalId)).toEqual([]);
  });

  it('a member of another company opening the page is the customer opening it (T-F5-007)', async () => {
    const deal = await aSharedDeal();
    const byOutsider = await world
      .as(elsewhere.members.owner)
      .call('POST', `/customer-link/${deal.token}/opened`, { deviceClass: 'phone' });
    expect(byOutsider.status).toBe(HttpStatus.NO_CONTENT);
    expect(await eventsOf(world, deal.link.id)).toMatchObject([{ eventType: 'opened' }]);
  });

  it('a section’s time on screen is the product’s own evidence of a read (F5-28)', async () => {
    const deal = await aSharedDeal();
    const viewed = await linkAct<null>(world, deal.token, 'viewed', {
      section: 'price',
      seconds: 42,
    });
    expect(viewed.status).toBe(HttpStatus.NO_CONTENT);
    expect(await eventsOf(world, deal.link.id)).toMatchObject([
      { eventType: 'section_viewed', section: 'price', durationSeconds: 42, proposalVersion: 1 },
    ]);
  });

  it('a link over its hourly views answers the busy page with a person, never a blank or an error (F5-78)', async () => {
    const deal = await aSharedDeal();
    const now = new Date();
    await db()
      .insert(linkEvent)
      .values(
        Array.from({ length: LINK_CEILINGS.viewsPerHour }, () => ({
          tenantId: here.company.tenantId,
          linkId: deal.link.id,
          eventType: 'opened' as const,
          occurredAt: now,
          deviceClass: 'phone' as const,
          proposalVersion: 1,
        })),
      );
    // At the ceiling the page still serves; the open that crosses it is the last one recorded.
    expect((await pageOf(world, deal.token)).body.kind).toBe('proposal');
    await opened(deal.token);
    const busy = await pageOf(world, deal.token);
    expect(busy.status).toBe(HttpStatus.OK);
    expect(busy.body).toMatchObject({ kind: 'off', off: { reason: 'busy' } });
    expect(busy.body.person?.phoneE164).toBe(here.people.seller.phoneE164);
    await opened(deal.token);
    expect(await eventsOf(world, deal.link.id)).toHaveLength(LINK_CEILINGS.viewsPerHour + 1);
  });

  it('the question and call buttons share one hourly ceiling; past it an act is refused and the page says so (F5-78)', async () => {
    const deal = await aSharedDeal();
    for (let sent = 1; sent <= LINK_CEILINGS.respondsPerHour; sent += 1) {
      const reply = await linkAct(world, deal.token, 'questions', { text: `Question ${sent}` });
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.mayAsk).toBe(sent < LINK_CEILINGS.respondsPerHour);
    }
    const over = await linkAct(world, deal.token, 'call-requests', { at: null });
    expect(over.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(over)).toBe('ceiling_met');
    expect(refusalOf(await linkAct(world, deal.token, 'accept', anyVersion))).toBe('ceiling_met');
    // Reading is never taken away by the respond ceiling.
    expect((await pageOf(world, deal.token)).body).toMatchObject({
      kind: 'proposal',
      mayAsk: false,
      proposal: { mayRespond: false },
    });
  });

  it('one address over its share is refused while another address still reads its link (F5-78)', async () => {
    const deal = await aSharedDeal();
    const ceiling = publicCeilingOf(world);
    ceiling.reset();
    const now = Date.now();
    for (let asked = 0; asked <= LINK_CEILINGS.publicRequestsPerAddressPerMinute; asked += 1)
      ceiling.admits(FLOODING_ADDRESS, now);
    expect(ceiling.admits(FLOODING_ADDRESS, now)).toBe(false);
    expect((await pageOf(world, deal.token)).status).toBe(HttpStatus.OK);
    ceiling.reset();
  });

  it('unknown tokens from one address use up only that address’s share, never another’s (F5-78)', async () => {
    const deal = await aSharedDeal();
    const ceiling = publicCeilingOf(world);
    ceiling.reset();
    const unknown = 'B'.repeat(deal.token.length);
    for (let asked = 0; asked < LINK_CEILINGS.publicRequestsPerAddressPerMinute; asked += 1)
      expect((await pageOf(world, unknown)).status).toBe(HttpStatus.NOT_FOUND);
    const refused = await pageOf(world, deal.token);
    expect(refused.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(refused.body).toMatchObject({ error: { code: 'RATE_LIMITED' } });
    expect(ceiling.admits(FLOODING_ADDRESS, Date.now())).toBe(true);
    ceiling.reset();
    expect((await pageOf(world, deal.token)).status).toBe(HttpStatus.OK);
  });

  it('the backstop over every public route together asks a caller to wait (F5-78)', async () => {
    const deal = await aSharedDeal();
    const ceiling = publicCeilingOf(world);
    ceiling.reset();
    const now = Date.now();
    const share = LINK_CEILINGS.publicRequestsPerAddressPerMinute;
    for (let asked = 0; asked < LINK_CEILINGS.publicRequestsPerMinute; asked += 1)
      ceiling.admits(`198.51.100.${Math.floor(asked / share)}`, now);
    expect((await pageOf(world, deal.token)).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    ceiling.reset();
    expect((await pageOf(world, deal.token)).status).toBe(HttpStatus.OK);
  });

  it('a closed lead’s link reads "no longer active" with a person, and nothing of the customer (F5-25)', async () => {
    const deal = await aSharedDeal();
    const lost = await owner().call('POST', `/leads/${deal.leadId}/lost`, {
      reason: 'price',
      capturedAt: at(),
    });
    expect(lost.status).toBe(HttpStatus.OK);
    const page = await pageOf(world, deal.token);
    expect(page.status).toBe(HttpStatus.OK);
    expect(page.body).toMatchObject({ kind: 'off', off: { reason: 'ended' }, mayAsk: false });
    expect(page.body.person).toEqual({
      name: here.people.seller.name,
      phoneE164: here.people.seller.phoneE164,
    });
    expect(Object.keys(page.body).sort()).toEqual(
      ['company', 'kind', 'language', 'mayAsk', 'off', 'person'].sort(),
    );
    expect(JSON.stringify(page.body)).not.toContain('Anil Sharma');
  });

  it('a proposal a person withdrew on an open lead reads "no active proposal" (T-F5-004)', async () => {
    const deal = await aSharedDeal();
    const withdrawn = await owner().call('POST', `/proposals/${deal.proposalId}/withdraw`, {
      capturedAt: at(),
    });
    expect(withdrawn.status).toBe(HttpStatus.OK);
    expect((await pageOf(world, deal.token)).body).toMatchObject({
      kind: 'off',
      off: { reason: 'none' },
    });
  });

  it('the customer’s page never carries our cost or the margin (M06-09, F5-38)', async () => {
    const deal = await aSharedDeal();
    const page = await pageOf(world, deal.token);
    const document = page.body.proposal?.document;
    expect(document?.money?.margin ?? null).toBeNull();
    expect(JSON.stringify(document?.fields.system)).not.toContain('"ourCost":"');
    // The page names who prepared it, never their account.
    expect(document?.preparedBy.userId ?? null).toBeNull();
  });
});
