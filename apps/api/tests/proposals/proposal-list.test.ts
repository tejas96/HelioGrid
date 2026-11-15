import type { CatalogItemWire, LeadDetail, ProposalList } from '@heliogrid/contracts';
import { FOUNDER_ROLE, PROPOSAL_STEPS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aPanelSpec } from '../catalog/support';
import { aPair, mergeOf } from '../crm/merge-support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDraft,
  aGenerated,
  aLead,
  aReadyDraft,
  aShared,
  aStaffedCompany,
  type Caller,
  edited,
  fiveComponents,
  generate,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
  retryKey,
  share,
  systemOf,
} from './support';

/**
 * The proposals a person finds (`T-M06-019`, `M06-48`; the lead's section `M06-02`, `M06-58`; the
 * catalog's open-draft count `M01-42`): the list holds the proposals of the leads its reader may
 * see, each chip's count and what the waiting ones are worth; the lead says where each of its own
 * stands; and an item named by an open draft says so before it is archived.
 */

const here = aStaffedCompany('Proposal List EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  finance: [preset.finance],
});
const there = aStaffedCompany('Proposal List Other EPC', { owner: [FOUNDER_ROLE] });
/** A company of its own, so an edit after a share moves no total another case counts. */
const editing = aStaffedCompany('Proposal List Edit EPC', { owner: [FOUNDER_ROLE] });
/** A company of its own, so a newer version generated after a share moves no other case's total. */
const repricing = aStaffedCompany('Proposal List Reprice EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL LIST PROOF',
  'The proposals list, the lead’s section and the open-draft count are UNPROVEN in this run.',
);

const PAYABLE = '190575.00';
/** The owner's three proposals, on the eleven steps a draft counts. */
const MADE = 3;
const STEPS = PROPOSAL_STEPS.length;

describe.skipIf(skip)('Finding proposals, over HTTP against a migrated database', () => {
  let world: ProposalsWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);
  const listOf = async (caller: Caller, query = '') => {
    const reply = await caller.call<ProposalList>('GET', `/proposals${query}`);
    expect(reply.status).toBe(HttpStatus.OK);
    return reply.body;
  };
  const leadOf = async (caller: Caller, leadId: string) =>
    (await caller.call<LeadDetail>('GET', `/leads/${leadId}`)).body;
  const made = { shared: '', ready: '', draft: '', sellersLead: '' };

  beforeAll(async () => {
    world = await openProposalsWorld([here, there, editing, repricing]);
    // The owner's three: one with the customer, one generated and not sent, one still a draft.
    made.shared = (await aShared(owner(), await aLead(owner()))).id;
    made.ready = (await aGenerated(owner(), await aLead(owner()))).proposal.id;
    // The Sales Executive's own lead carries the draft, which the executive started.
    made.sellersLead = await aLead(owner());
    await ownLead(world, made.sellersLead, here.people.seller.userId);
    made.draft = (await aDraft(seller(), made.sellersLead)).id;
  });

  afterAll(async () => {
    await world.close();
  });

  it('holds each proposal with its word, number and price, newest change first, and counts each chip', async () => {
    const list = await listOf(owner());
    expect(list.counts).toEqual({ all: 3, waiting: 1, draft: 2, accepted: 0, closed: 0 });
    // Only the one with the customer is worth anything yet: a pipeline figure, to the paisa.
    expect(list.waitingValue).toBe(PAYABLE);
    expect(list.currencyCode).toBe('INR');
    expect(list.rows.totalCount).toBe(MADE);
    expect(list.rows.items.map((row) => [row.id, row.standing])).toEqual([
      [made.draft, 'draft'],
      [made.ready, 'ready'],
      [made.shared, 'shared'],
    ]);
    const shared = list.rows.items.find((row) => row.id === made.shared);
    expect(shared).toMatchObject({
      number: expect.stringMatching(/^PRP-\d{4,}$/),
      version: 1,
      capacityKw: 3,
      payable: PAYABLE,
      customerName: 'Anil Sharma',
      latest: { event: 'shared' },
      stale: false,
    });
    const draft = list.rows.items.find((row) => row.id === made.draft);
    expect(draft).toMatchObject({ number: null, version: null, payable: null });
    expect(draft?.progress.of).toBe(STEPS);
  });

  it('a draft edited after its share is not the price the list shows: the row and the waiting total keep the sent price (M06-48)', async () => {
    const editor = world.as(editing.members.owner);
    const sent = await aShared(editor, await aLead(editor));
    const lower = await edited(editor, sent, {
      fields: { system: systemOf(sent, { priceInclusive: '150000.00' }) },
    });
    expect(lower.revision).toBeGreaterThan(sent.revision);

    const list = await listOf(editor);
    expect(list.rows.items.find((row) => row.id === sent.id)?.payable).toBe(PAYABLE);
    expect(list.waitingValue).toBe(PAYABLE);
  });

  it('a newer version generated and not shared is not the price the customer was sent: the row, the waiting total and the lead keep the shared one, and name it (M06-45)', async () => {
    const rep = world.as(repricing.members.owner);
    const leadId = await aLead(rep);
    const sent = await aShared(rep, leadId);
    const lower = await edited(rep, sent, {
      fields: { system: systemOf(sent, { priceInclusive: '175000.00' }) },
    });
    const newer = await generate(rep, lower, { changeNote: 'A smaller inverter.' });
    expect(newer.status).toBe(HttpStatus.CREATED);

    const list = await listOf(rep);
    // The version a row names is the one whose price it shows: the one on the customer's link.
    expect(list.rows.items.find((row) => row.id === sent.id)).toMatchObject({
      payable: PAYABLE,
      version: 1,
    });
    expect(list.waitingValue).toBe(PAYABLE);
    const onLead = (await leadOf(rep, leadId)).proposals?.items.find((one) => one.id === sent.id);
    expect(onLead).toMatchObject({ payable: PAYABLE, version: 1 });
  });

  it('a chip narrows the rows and leaves every count as it was', async () => {
    const waiting = await listOf(owner(), '?filter=waiting');
    expect(waiting.rows.items.map((row) => row.id)).toEqual([made.shared]);
    expect(waiting.rows.totalCount).toBe(1);
    expect(waiting.counts).toMatchObject({ all: 3, draft: 2 });
    const drafts = await listOf(owner(), '?filter=draft&limit=1');
    expect(drafts.rows.items).toHaveLength(1);
    expect(drafts.rows.totalCount).toBe(2);
    expect((await listOf(owner(), '?filter=closed')).rows.items).toEqual([]);
  });

  it('a Sales Executive finds the proposals of their own leads alone, counts and worth included', async () => {
    const list = await listOf(seller());
    expect(list.rows.items.map((row) => row.id)).toEqual([made.draft]);
    expect(list.counts).toEqual({ all: 1, waiting: 0, draft: 1, accepted: 0, closed: 0 });
    expect(list.waitingValue).toBe('0.00');
    expect(list.canStart).toBe(true);
  });

  it('"mine" keeps the proposals the reader started', async () => {
    const mine = await listOf(owner(), '?mine=true');
    expect(mine.rows.items.map((row) => row.id).sort()).toEqual([made.ready, made.shared].sort());
    expect(mine.counts.all).toBe(2);
  });

  it('Finance reads the list and is offered no new proposal; another company finds none of these', async () => {
    const finance = await listOf(world.as(here.members.finance));
    expect(finance.canStart).toBe(false);
    const stranger = await listOf(world.as(there.members.owner));
    expect(stranger.rows.items).toEqual([]);
    expect(stranger.counts.all).toBe(0);
    expect(stranger.waitingValue).toBe('0.00');
  });

  it('the lead says where each of its proposals stands, and what its reader may do', async () => {
    const leadId = await aLead(owner());
    const empty = await leadOf(owner(), leadId);
    expect(empty.proposals).toEqual({
      items: [],
      canStart: true,
      canWithdraw: true,
      sibling: null,
    });
    const draft = await aDraft(owner(), leadId);
    const drafted = await leadOf(owner(), leadId);
    expect(drafted.sections.proposals).toBe(1);
    expect(drafted.proposals?.items).toMatchObject([
      { id: draft.id, standing: 'draft', number: null, live: true, progress: { of: 11 } },
    ]);
    const complete = drafted.proposals?.items[0]?.progress.complete ?? 0;
    const further = await edited(owner(), draft, { fields: { components: fiveComponents() } });
    const after = await leadOf(owner(), leadId);
    expect(after.proposals?.items[0]?.progress.complete).toBe(complete + 1);
    expect(further.revision).toBe(draft.revision + 1);
    // A lost lead offers no new proposal; its section still reads.
    const lost = await owner().call('POST', `/leads/${leadId}/lost`, {
      reason: 'price',
      capturedAt: new Date().toISOString(),
    });
    expect(lost.status).toBe(HttpStatus.OK);
    expect((await leadOf(owner(), leadId)).proposals).toMatchObject({ canStart: false });
  });

  it('a lead whose customer has a proposal on another lead is told which', async () => {
    const pair = await aPair(owner());
    expect((await mergeOf(owner(), pair.survivor.customer.id, pair.loser.customer.id)).status).toBe(
      HttpStatus.OK,
    );
    const shared = await aShared(owner(), pair.survivor.lead.id);
    const other = await leadOf(owner(), pair.loser.lead.id);
    expect(other.proposals?.sibling).toEqual({
      leadId: pair.survivor.lead.id,
      proposalId: shared.id,
      number: expect.stringMatching(/^PRP-\d{4,}$/),
    });
    // The lead that holds it is warned of nothing: the proposal is its own.
    expect((await leadOf(owner(), pair.survivor.lead.id)).proposals?.sibling).toBeNull();
  });

  it('a catalog item counts the open drafts that name it, and no other company’s', async () => {
    const item = await owner().call<CatalogItemWire>(
      'POST',
      '/catalog/items',
      {
        brand: 'Own Panels',
        model: `List ${Date.now()}`,
        spec: aPanelSpec(),
        certifications: [],
        preferred: false,
      },
      retryKey(),
    );
    expect(item.status).toBe(HttpStatus.CREATED);
    const read = async () =>
      (await owner().call<CatalogItemWire>('GET', `/catalog/items/${item.body.id}`)).body
        .openDraftCount;
    expect(await read()).toBe(0);
    const ready = await aReadyDraft(owner(), await aLead(owner()));
    const named = await edited(owner(), ready, {
      fields: {
        components: fiveComponents({ source: 'own_item', catalogItemId: item.body.id }),
      },
    });
    expect(await read()).toBe(1);
    // Generated and not yet sent, it is still a draft the item's archive would touch.
    expect((await generate(owner(), named)).status).toBe(HttpStatus.CREATED);
    expect(await read()).toBe(1);
    // With the customer it is a record: the count is of open drafts alone.
    expect((await share(owner(), named.id)).status).toBe(HttpStatus.OK);
    expect(await read()).toBe(0);
  });
});
