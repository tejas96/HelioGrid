import type { LeadInbox, LeadList, SearchResults } from '@heliogrid/contracts';
import { lead, subscription } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aTrial } from '../billing/support';
import { actBy, aPanelSpec, catalogServiceOf, noKey } from '../catalog/support';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type Caller,
  type CrmWorld,
  captured,
  openCrmWorld,
  ownLead,
  preset,
  retryKey,
} from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';

/**
 * The global search (`F6-20`…`F6-25`, `T-FPLAT-020`): one read over leads,
 * customers, people and catalog items, each group narrowed as its own domain is — and never by the
 * billing state. A junk lead is in no queue or list; search is where it is found (`M02-55`).
 */

const here = aStaffedCompany('Search EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
  'Kiran Kulkarni': [preset.survey_engineer],
});
const elsewhere = aStaffedCompany('Other Search EPC', { owner: [FOUNDER_ROLE] });
const halted = aStaffedCompany('Halted Search EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'GLOBAL SEARCH PROOF',
  'The global search is UNPROVEN on the wire in this run.',
);

/** A number begun: its last digits not yet typed. */
const DIGITS_NOT_YET_TYPED = 3;
/** How long ago the halted company's paid period ended. */
const PERIOD_DAYS = 5;

describe.skipIf(skip)('the global search, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  const search = async (caller: Caller, q: string) => {
    const reply = await caller.call<SearchResults>('GET', `/search?q=${encodeURIComponent(q)}`);
    expect(reply.status).toBe(HttpStatus.OK);
    return reply.body;
  };
  /** Bins a lead as the junk act leaves it — on the admin path, as the act is proven by its slice. */
  const junk = async (leadId: string) => {
    const closedAt = new Date();
    await world.pools.admin.db
      .update(lead)
      .set({
        lifecycleState: 'junk',
        closedAs: 'junk',
        closedAt,
        closedBy: here.people.owner.userId,
      })
      .where(eq(lead.id, leadId));
  };

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere, halted]);
  });

  afterAll(async () => {
    await world.close();
  });

  it("every result is a record the searcher's scopes let them open", async () => {
    const theirs = await captured(owner(), aCapture(aPhone(), { name: 'Asha Kulkarni' }));
    const owners = await captured(owner(), aCapture(aPhone(), { name: 'Bhavesh Kulkarni' }));
    const queued = await captured(owner(), aCapture(aPhone(), { name: 'Chitra Kulkarni' }));
    await ownLead(world, theirs.lead.id, here.people.rep.userId);
    await ownLead(world, owners.lead.id, here.people.owner.userId);
    await captured(
      world.as(elsewhere.members.owner),
      aCapture(aPhone(), { name: 'Deepak Kulkarni' }),
    );
    const sku = { brand: 'Kulkarni Solar', model: 'KS-1', spec: aPanelSpec(), certifications: [] };
    await catalogServiceOf(world.pools).createItem(
      here.company.tenantId,
      [preset.epc_owner],
      { ...sku, preferred: false },
      noKey,
      actBy(here.people.owner.userId),
    );

    const rep = world.as(here.members.rep);
    const repFound = await search(rep, 'kulkarni');
    expect(repFound.leads).toMatchObject({ total: 1, items: [{ id: theirs.lead.id }] });
    expect(repFound.customers).toMatchObject({ total: 1, items: [{ id: theirs.customer.id }] });
    expect(repFound.people).toEqual({ total: 0, items: [] });
    expect(repFound.catalog.items.map((item) => item.brand)).toContain('Kulkarni Solar');
    await expectEachOpens(rep, repFound);

    const ownerFound = await search(owner(), 'kulkarni');
    expect(ownerFound.leads.items.map((one) => one.id).sort()).toEqual(
      [theirs.lead.id, owners.lead.id, queued.lead.id].sort(),
    );
    expect(ownerFound.people.items).toEqual([
      { userId: here.people['Kiran Kulkarni'].userId, name: 'Kiran Kulkarni' },
    ]);
    await expectEachOpens(owner(), ownerFound);

    const stranger = await search(world.as(elsewhere.members.owner), 'kulkarni');
    expect(stranger.leads.items.map((one) => one.name)).toEqual(['Deepak Kulkarni']);
    expect(stranger.people.items).toEqual([]);

    // Punctuation alone asks for nothing — never every catalog item, which the list reads it as.
    const none = { total: 0, items: [] };
    expect(await search(owner(), '- +')).toEqual({
      leads: none,
      customers: none,
      people: none,
      catalog: none,
    });
  });

  it("a junk lead's phone finds it with its junk state", async () => {
    const binned = await captured(owner(), aCapture(aPhone(), { name: 'Wrong Caller' }));
    await junk(binned.lead.id);
    const typed = binned.customer.phoneE164.replace(/^\+91(\d{5})(\d{5})$/, '0$1 $2');

    const found = await search(owner(), typed);
    expect(found.leads.items[0]).toMatchObject({
      id: binned.lead.id,
      phoneE164: binned.customer.phoneE164,
      state: 'junk',
    });
    const begun = await search(owner(), binned.customer.phoneE164.slice(0, -DIGITS_NOT_YET_TYPED));
    expect(begun.leads.items.find((one) => one.id === binned.lead.id)?.state).toBe('junk');
  });

  it('a junk lead is in no queue or list and search still finds it', async () => {
    const binned = await captured(owner(), aCapture(aPhone(), { name: 'Kamala Spamwala' }));
    const queueIds = async () =>
      (await owner().call<LeadInbox>('GET', '/lead-inbox?limit=100')).body.items.map(
        (one) => one.id,
      );
    const listIds = async (query: string) =>
      (await owner().call<LeadList>('GET', `/leads?limit=100${query}`)).body.items.map(
        (one) => one.id,
      );
    expect(await queueIds()).toContain(binned.lead.id);

    await junk(binned.lead.id);
    expect(await queueIds()).not.toContain(binned.lead.id);
    expect(await listIds('')).not.toContain(binned.lead.id);
    expect(await listIds('&q=Kamala')).not.toContain(binned.lead.id);
    const found = await search(owner(), 'Kamala');
    expect(found.leads.items).toMatchObject([{ id: binned.lead.id, state: 'junk' }]);
  });

  it('search answers for a halted tenant', async () => {
    const theirs = world.as(halted.members.owner);
    const before = await captured(theirs, aCapture(aPhone(), { name: 'Harish Patil' }));
    const tenantId = halted.company.tenantId;
    await aTrial(world.pools.admin.db, tenantId, Date.now());
    await world.pools.admin.db
      .update(subscription)
      .set({
        state: 'halted',
        stateEnteredAt: new Date(Date.now() - MS_PER_DAY),
        paidPeriodEnd: new Date(Date.now() - PERIOD_DAYS * MS_PER_DAY),
      })
      .where(eq(subscription.tenantId, tenantId));

    const paused = await theirs.call('POST', '/leads', aCapture(aPhone()), retryKey());
    expect(paused.status).toBe(HttpStatus.FORBIDDEN);
    const found = await search(theirs, 'Harish');
    expect(found.leads.items).toMatchObject([{ id: before.lead.id, name: 'Harish Patil' }]);
  });
});

/** Every row the searcher was shown opens for them: its lead, its customer's stream, its item. */
async function expectEachOpens(caller: Caller, found: SearchResults): Promise<void> {
  const paths = [
    ...found.leads.items.map((one) => `/leads/${one.id}`),
    ...found.customers.items.map((one) => `/customers/${one.id}/activities`),
    ...found.catalog.items.map((one) => `/catalog/items/${one.id}`),
  ];
  for (const path of paths) {
    expect({ path, status: (await caller.call('GET', path)).status }).toEqual({
      path,
      status: HttpStatus.OK,
    });
  }
}
