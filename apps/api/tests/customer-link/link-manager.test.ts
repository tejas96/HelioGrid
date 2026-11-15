import type { Contact, CustomerLink, CustomerLinks } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  type AddressedLink,
  aGenerated,
  aLead,
  aPhoneNumber,
  aShared,
  aStaffedCompany,
  auditEntriesOf,
  customerOf,
  customersLink,
  linkAct,
  linksOf,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  pageOf,
  preset,
  projectsStandIn,
  refusalOf,
  retryKey,
  share,
  storedEntriesOf,
  tokenOf,
} from './support';

/**
 * The deal's link manager (`T-M06-020`, `T-F5-007`; `F5-26`, `F5-27`, `F5-30`, `F5-31`): named
 * links per contact, who opened which, a rename, a new address and the kill switch — for the
 * sellers and the project's manager alone, and none of it on the customer's page.
 */

const here = aStaffedCompany('Link Manager EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  seller: [preset.sales_executive],
  designer: [preset.design_engineer],
  pm: [preset.project_manager],
});
const there = aStaffedCompany('Link Manager Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'LINK MANAGER PROOF',
  'Named links, their grants and the other-company 404 are UNPROVEN in this run.',
);

const at = () => new Date().toISOString();

describe.skipIf(skip)('The deal’s link manager, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);

  /** A shared deal the seller holds, with a second contact on its customer. */
  const aDealWithASpouse = async (holder: 'seller' | 'manager' = 'seller') => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people[holder].userId);
    const { id: proposalId } = await aShared(owner(), leadId);
    const customer = await customerOf(owner(), leadId);
    const spouse = await owner().call<Contact>(
      'POST',
      `/customers/${customer.id}/contacts`,
      { name: 'Sunita Sharma', phoneE164: aPhoneNumber(), roleLabelId: null },
      retryKey(),
    );
    if (spouse.status !== HttpStatus.CREATED) throw new Error(`contact: got ${spouse.status}`);
    return { leadId, proposalId, spouseId: spouse.body.id };
  };
  const mint = (
    caller: ReturnType<typeof owner>,
    leadId: string,
    contactId: string | null,
    label = 'Sunita’s link',
    key = retryKey(),
  ) =>
    caller.call<AddressedLink>(
      'POST',
      `/leads/${leadId}/links`,
      { label, contactId, capturedAt: at() },
      key,
    );

  beforeAll(async () => {
    world = await openProposalsWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['the EPC Owner', 'owner', HttpStatus.OK],
    ['the Sales Manager who holds the lead', 'manager', HttpStatus.OK],
    ['the Sales Executive who holds the lead', 'seller', HttpStatus.OK],
    ['a Design Engineer', 'designer', HttpStatus.FORBIDDEN],
  ] as const)(
    '%s reads and works the deal’s links as their grant says',
    async (_, who, expected) => {
      const { leadId, spouseId } = await aDealWithASpouse(who === 'manager' ? 'manager' : 'seller');
      const caller = world.as(here.members[who]);
      expect((await linksOf(caller, leadId)).status).toBe(expected);
      const minted = await mint(caller, leadId, spouseId);
      expect(minted.status).toBe(expected === HttpStatus.OK ? HttpStatus.CREATED : expected);
      const { link } = await customersLink(owner(), leadId);
      for (const [method, path, body] of [
        ['POST', `/links/${link.id}/address`, { capturedAt: at() }],
        ['PUT', `/links/${link.id}/label`, { label: link.label }],
        ['POST', `/links/${link.id}/remint`, { revokeEarlier: false, capturedAt: at() }],
        ['POST', `/links/${link.id}/revoke`, { capturedAt: at() }],
      ] as const) {
        expect((await caller.call(method, path, body)).status).toBe(expected);
      }
    },
  );

  it('another company’s lead and link are not found', async () => {
    const { leadId, spouseId } = await aDealWithASpouse();
    const { link } = await customersLink(owner(), leadId);
    const stranger = world.as(there.members.owner);
    expect((await linksOf(stranger, leadId)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await mint(stranger, leadId, spouseId)).status).toBe(HttpStatus.NOT_FOUND);
    for (const [method, path, body] of [
      ['POST', `/links/${link.id}/address`, { capturedAt: at() }],
      ['PUT', `/links/${link.id}/label`, { label: 'Theirs' }],
      ['POST', `/links/${link.id}/remint`, { revokeEarlier: true, capturedAt: at() }],
      ['POST', `/links/${link.id}/revoke`, { capturedAt: at() }],
    ] as const) {
      expect((await stranger.call(method, path, body)).status).toBe(HttpStatus.NOT_FOUND);
    }
    // And nothing of theirs changed: the link still serves.
    expect((await customersLink(owner(), leadId)).link.status).toBe('active');
  });

  it('a lead outside a Sales Executive’s scope answers as one that does not exist', async () => {
    const leadId = await aLead(owner());
    await ownLead(world, leadId, here.people.manager.userId);
    await aShared(owner(), leadId);
    expect((await linksOf(world.as(here.members.seller), leadId)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('no link can be named before the proposal is shared (F5-20)', async () => {
    const leadId = await aLead(owner());
    await aGenerated(owner(), leadId);
    const early = await mint(owner(), leadId, null, 'Too early');
    expect(early.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(early)).toBe('not_shared');
  });

  it('a named link is its contact’s own: opened and revoked without touching the customer’s (F5-26, F5-27)', async () => {
    const { leadId, spouseId } = await aDealWithASpouse();
    const key = retryKey();
    const minted = await mint(owner(), leadId, spouseId, 'Sunita’s link', key);
    expect(minted.status).toBe(HttpStatus.CREATED);
    expect(minted.body.link).toMatchObject({
      label: 'Sunita’s link',
      contact: { id: spouseId, name: 'Sunita Sharma' },
      status: 'active',
    });
    // The same send again answers the same link and address (`F4-07`).
    const again = await mint(owner(), leadId, spouseId, 'Sunita’s link', key);
    expect(again.body).toEqual(minted.body);

    const spouseToken = tokenOf(minted.body.url);
    const own = await customersLink(owner(), leadId);
    expect(spouseToken).not.toBe(own.token);
    await linkAct<null>(world, spouseToken, 'opened', { deviceClass: 'tablet' });

    const listed = (await linksOf(owner(), leadId)).body as CustomerLinks;
    const of = (id: string) => listed.links.find((link) => link.id === id) as CustomerLink;
    expect(of(minted.body.link.id)).toMatchObject({ opens: 1, lastDeviceClass: 'tablet' });
    expect(of(own.link.id)).toMatchObject({ opens: 0, lastOpenedAt: null });
    expect(listed.contacts).toContainEqual({ id: spouseId, name: 'Sunita Sharma' });

    const revoked = await owner().call<CustomerLink>(
      'POST',
      `/links/${minted.body.link.id}/revoke`,
      { capturedAt: at() },
    );
    expect(revoked.body).toMatchObject({ status: 'revoked' });
    expect((await pageOf(world, spouseToken)).body.off?.reason).toBe('revoked');
    expect((await pageOf(world, own.token)).body.kind).toBe('proposal');
    const twice = await owner().call('POST', `/links/${minted.body.link.id}/revoke`, {
      capturedAt: at(),
    });
    expect(refusalOf(twice)).toBe('already_revoked');
  });

  it('after the customer’s link is revoked a share mints them a new one, the message carries it, and a named link can still be made (F5-20, F5-76)', async () => {
    const { leadId, proposalId, spouseId } = await aDealWithASpouse();
    const before = await customersLink(owner(), leadId);
    await owner().call('POST', `/links/${before.link.id}/revoke`, { capturedAt: at() });

    expect((await mint(owner(), leadId, spouseId)).status).toBe(HttpStatus.CREATED);
    expect((await share(owner(), proposalId)).status).toBe(HttpStatus.OK);
    const after = await customersLink(owner(), leadId);
    expect(after.link.id).not.toBe(before.link.id);
    expect((await pageOf(world, after.token)).body.kind).toBe('proposal');
    const words = await owner().call<{ link: string | null }>(
      'GET',
      `/proposals/${proposalId}/share-message`,
    );
    expect(words.body.link).not.toBeNull();
    expect(tokenOf(words.body.link ?? '')).toBe(after.token);
  });

  it('two names for one contact sent at once answer the same link (F5-26)', async () => {
    const { leadId, spouseId } = await aDealWithASpouse();
    const held = await holdLock(sql`select 1 from lead where id = ${leadId} for update`);
    const both = [mint(owner(), leadId, spouseId), mint(owner(), leadId, spouseId)];
    await held.waitForWaiters(2);
    await held.release();
    const replies = await Promise.all(both);
    expect(replies.map((reply) => reply.status)).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(replies[0]?.body.link.id).toBe(replies[1]?.body.link.id);
  });

  it('the customer’s page shows no other link’s name, contact or history (F5-30)', async () => {
    const { leadId, spouseId } = await aDealWithASpouse();
    const minted = await mint(owner(), leadId, spouseId, 'Landlord-check-7Q');
    await linkAct<null>(world, tokenOf(minted.body.url), 'opened', { deviceClass: 'phone' });
    const { link, token } = await customersLink(owner(), leadId);
    const page = JSON.stringify((await pageOf(world, token)).body);
    for (const hidden of ['Landlord-check-7Q', 'Sunita Sharma', link.id, 'lastOpenedAt', 'opens']) {
      expect(page).not.toContain(hidden);
    }
  });

  it('a rename is recorded once: the same name again writes nothing', async () => {
    const { leadId } = await aDealWithASpouse();
    const { link } = await customersLink(owner(), leadId);
    const renames = async () =>
      (await storedEntriesOf(world, leadId)).filter(
        (entry) =>
          entry.kind === 'customer_link_changed' &&
          (entry.body as { change: string }).change === 'relabelled',
      ).length;
    const renamed = await owner().call<CustomerLink>('PUT', `/links/${link.id}/label`, {
      label: 'Anil — home',
    });
    expect(renamed.body.label).toBe('Anil — home');
    expect(await renames()).toBe(1);
    await owner().call('PUT', `/links/${link.id}/label`, { label: 'Anil — home' });
    expect(await renames()).toBe(1);
  });

  it('every mint, new address and revoke is audited with the member who did it (F5-31, F5-79)', async () => {
    const { leadId } = await aDealWithASpouse();
    const { link } = await customersLink(owner(), leadId);
    await owner().call('POST', `/links/${link.id}/remint`, {
      revokeEarlier: false,
      capturedAt: at(),
    });
    await owner().call('POST', `/links/${link.id}/revoke`, { capturedAt: at() });
    for (const event of ['minted', 'reminted', 'revoked'] as const) {
      const entries = await auditEntriesOf(world, here.company.tenantId, `customer_link.${event}`);
      expect(entries.filter((entry) => entry.subjectRef === link.id)).toMatchObject([
        { actorKind: 'tenant_user', actorRef: here.people.owner.userId },
      ]);
    }
  });

  it('once the deal is won its project manager works the links; any other project manager finds none (T-M06-020)', async () => {
    const { leadId } = await aDealWithASpouse();
    const pm = world.as(here.members.pm);
    expect((await linksOf(pm, leadId)).status).toBe(HttpStatus.NOT_FOUND);
    projectsStandIn(
      world,
      new Map([
        [
          leadId,
          {
            projectId: '018f0000-0000-7000-8000-000000000002',
            stage: 'installation',
            cancelledAt: null,
            handedOverAt: null,
            managerId: here.people.pm.userId,
          },
        ],
      ]),
    );
    try {
      const listed = await linksOf(pm, leadId);
      expect(listed.status).toBe(HttpStatus.OK);
      expect(listed.body.acts).toEqual({ mint: true, revoke: true });
      const [own] = listed.body.links;
      const fresh = await pm.call<AddressedLink>('POST', `/links/${own?.id}/remint`, {
        revokeEarlier: true,
        capturedAt: at(),
      });
      expect(fresh.status).toBe(HttpStatus.OK);
      expect((await pageOf(world, tokenOf(fresh.body.url))).body.kind).toBe('progress');
    } finally {
      projectsStandIn(world, new Map());
    }
  });
});
