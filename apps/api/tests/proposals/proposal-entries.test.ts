import type { ProposalEntries, ProposalList } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aLeadBy } from '../crm/assign-support';
import { aDesign, openStudioWorld, type StudioWorld } from '../studio/support';
import { skipWithoutDatabase } from '../support/fixture';
import { aDraft, aLead, aShared, aStaffedCompany, type Caller, ownLead, preset } from './support';

/**
 * The Proposals page (`T-M05-001b`): the proposals of the leads its reader may see and, between
 * them by time, each design with no proposal yet; the 3D chip holds the designs, a status chip the
 * proposals alone; a design reaches its reader as its lead does; and the list an older app reads
 * (`GET /proposals`) holds no design.
 */

const here = aStaffedCompany('Proposal Entries EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});
const there = aStaffedCompany('Proposal Entries Other EPC', { owner: [FOUNDER_ROLE] });

/** What the owner's page holds: two proposals and two designs. */
const ON_THE_PAGE = 4;

const skip = skipWithoutDatabase(
  'PROPOSAL ENTRIES PROOF',
  'The Proposals page with its designs is UNPROVEN in this run.',
);

describe.skipIf(skip)('The Proposals page, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const seller = () => world.as(here.members.seller);
  const entriesOf = async (caller: Caller, query = '') => {
    const reply = await caller.call<ProposalEntries>('GET', `/proposal-entries${query}`);
    expect(reply.status).toBe(HttpStatus.OK);
    return reply.body;
  };
  const made = {
    shared: '',
    ownersDesign: '',
    sellersDraft: '',
    sellersDesign: '',
    otherDesign: '',
  };

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
    // Oldest first: the owner's shared proposal, then a design on another of the owner's leads.
    made.shared = (await aShared(owner(), await aLead(owner()))).id;
    made.ownersDesign = (await aDesign(owner(), await aLead(owner()))).design.id;
    // The Sales Executive's own lead: a draft, then a design.
    const sellersLead = await aLeadBy(owner(), 'Kavita More');
    await ownLead(world, sellersLead, here.people.seller.userId);
    made.sellersDraft = (await aDraft(seller(), sellersLead)).id;
    made.sellersDesign = (await aDesign(seller(), sellersLead)).design.id;
    // Another company's design.
    const other = world.as(there.members.owner);
    made.otherDesign = (await aDesign(other, await aLead(other))).design.id;
  });

  afterAll(async () => {
    await world.close();
  });

  it('holds proposals and designs newest change first, and counts each chip with the designs under All and 3D', async () => {
    const page = await entriesOf(owner());
    expect(page.rows.items.map((row) => [row.kind, row.id])).toEqual([
      ['design', made.sellersDesign],
      ['proposal', made.sellersDraft],
      ['design', made.ownersDesign],
      ['proposal', made.shared],
    ]);
    expect(page.counts).toEqual({
      '3d': 2,
      all: ON_THE_PAGE,
      waiting: 1,
      draft: 1,
      accepted: 0,
      closed: 0,
    });
    expect(page.rows.totalCount).toBe(ON_THE_PAGE);
    expect(page.currencyCode).toBe('INR');
    expect(page.canStart).toBe(true);
    const design = page.rows.items.find((row) => row.id === made.sellersDesign);
    expect(design).toMatchObject({
      kind: 'design',
      ordinal: 1,
      mount: 'roof',
      status: 'draft',
      customerName: 'Kavita More',
      changedBy: { userId: here.people.seller.userId },
    });
  });

  it('the 3D chip holds the designs alone, and a status chip the proposals alone', async () => {
    const threeD = await entriesOf(owner(), '?filter=3d');
    expect(threeD.rows.items.map((row) => row.id)).toEqual([made.sellersDesign, made.ownersDesign]);
    expect(threeD.rows.totalCount).toBe(2);
    const waiting = await entriesOf(owner(), '?filter=waiting');
    expect(waiting.rows.items.map((row) => [row.kind, row.id])).toEqual([
      ['proposal', made.shared],
    ]);
    expect(waiting.rows.totalCount).toBe(1);
    const draft = await entriesOf(owner(), '?filter=draft');
    expect(draft.rows.items.every((row) => row.kind === 'proposal')).toBe(true);
  });

  it('pages the mixed list in the same order, with the total of the chip that is on', async () => {
    const whole = await entriesOf(owner());
    const second = await entriesOf(owner(), '?limit=1&page=2');
    expect(second.rows.items.map((row) => row.id)).toEqual([whole.rows.items[1]?.id]);
    expect(second.rows.totalCount).toBe(ON_THE_PAGE);
  });

  it('a design reaches its reader as its lead does: the Sales Executive sees only their own lead’s', async () => {
    const page = await entriesOf(seller());
    expect(page.rows.items.map((row) => [row.kind, row.id])).toEqual([
      ['design', made.sellersDesign],
      ['proposal', made.sellersDraft],
    ]);
    expect(page.counts['3d']).toBe(1);
    expect(page.counts.all).toBe(2);
  });

  it('another company’s designs are never on the page, either way', async () => {
    const mine = await entriesOf(owner(), '?filter=3d');
    expect(mine.rows.items.map((row) => row.id)).not.toContain(made.otherDesign);
    const theirs = await entriesOf(world.as(there.members.owner), '?filter=3d');
    expect(theirs.rows.items.map((row) => row.id)).toEqual([made.otherDesign]);
  });

  it('the list an older app reads holds no design, and its All counts proposals alone', async () => {
    const reply = await owner().call<ProposalList>('GET', '/proposals');
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.rows.items.map((row) => row.id)).toEqual([made.sellersDraft, made.shared]);
    expect(reply.body.counts.all).toBe(2);
  });

  it('refuses a chip it does not know, naming the field', async () => {
    const reply = await owner().call<unknown>('GET', '/proposal-entries?filter=designs');
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(JSON.stringify(reply.body)).toContain('filter');
  });
});
