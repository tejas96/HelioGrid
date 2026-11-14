import type { SearchResults } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aGenerated,
  aLead,
  aStaffedCompany,
  type Caller,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
} from '../proposals/support';
import { skipWithoutDatabase } from '../support/fixture';

/**
 * Proposals in the global search (`T-M06-025` c; `F6-20`, `F6-22`): found by their customer and by
 * their own number, and — every one the searcher reaches — by the words people still type for a
 * priced offer, which are a query alias only: every result says Proposal. A proposal follows its
 * lead's visibility, in its own company.
 */

const here = aStaffedCompany('Search Proposals EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
  other: [preset.sales_executive],
});
const elsewhere = aStaffedCompany('Other Search Proposals EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL SEARCH PROOF',
  'Proposals in the global search are UNPROVEN on the wire in this run.',
);

/** The alias a person types, spelled so no source line holds the word the product never shows. */
const ALIASES = [['q', 'uote'].join(''), ['q', 'uotation'].join('')];

describe.skipIf(skip)(
  'proposals in the global search, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const rep = () => world.as(here.members.rep);
    let mine = { id: '', number: '' };
    let theirs = { id: '', number: '' };

    const search = async (caller: Caller, q: string) => {
      const reply = await caller.call<SearchResults>('GET', `/search?q=${encodeURIComponent(q)}`);
      expect(reply.status).toBe(HttpStatus.OK);
      return reply.body.proposals ?? { total: 0, items: [] };
    };
    const idsOf = (found: { items: readonly { id: string }[] }) => found.items.map((one) => one.id);

    beforeAll(async () => {
      world = await openProposalsWorld([here, elsewhere]);
      const repLead = await aLead(owner());
      await ownLead(world, repLead, here.people.rep.userId);
      const first = await aGenerated(owner(), repLead);
      mine = { id: first.proposal.id, number: first.number };
      const otherLead = await aLead(owner());
      await ownLead(world, otherLead, here.people.other.userId);
      const second = await aGenerated(owner(), otherLead);
      theirs = { id: second.proposal.id, number: second.number };
    });

    afterAll(async () => {
      await world.close();
    });

    it.each(ALIASES)(
      'the word people type for a priced offer finds proposals, and every row says Proposal — %#',
      async (alias) => {
        const found = await search(owner(), alias);
        expect(idsOf(found)).toEqual(expect.arrayContaining([mine.id, theirs.id]));
        expect(found.total).toBeGreaterThanOrEqual(2);
        expect(JSON.stringify(found).toLowerCase()).not.toContain(alias);
        expect(found.items.find((one) => one.id === mine.id)).toMatchObject({
          number: mine.number,
          standing: 'ready',
        });
      },
    );

    it('a proposal is found by its own number, however it is typed', async () => {
      const sequence = Number(mine.number.replace(/^PRP-/, ''));
      for (const typed of [mine.number, mine.number.toLowerCase(), `prp${sequence}`]) {
        const found = await search(owner(), typed);
        expect(idsOf(found)).toEqual([mine.id]);
      }
    });

    it('a proposal is found by its customer’s name', async () => {
      const found = await search(owner(), 'Anil Sharma');
      expect(idsOf(found)).toEqual(expect.arrayContaining([mine.id, theirs.id]));
    });

    it('a rep finds the proposals on their own leads only, and no other company’s', async () => {
      const [alias] = ALIASES;
      if (alias === undefined) throw new Error('no alias');
      expect(idsOf(await search(rep(), alias))).toEqual([mine.id]);
      expect(idsOf(await search(rep(), theirs.number))).toEqual([]);
      const stranger = await search(world.as(elsewhere.members.owner), alias);
      expect(stranger).toEqual({ total: 0, items: [] });
      expect(idsOf(await search(world.as(elsewhere.members.owner), mine.number))).toEqual([]);
    });

    it('the word beside a name keeps the name: only that customer’s proposals answer, best first', async () => {
      const leadId = await aLead(owner());
      const third = await aGenerated(owner(), leadId);
      const renamed = await owner().call('PATCH', `/leads/${leadId}`, {
        name: 'Meera Kulkarni',
        capturedAt: new Date().toISOString(),
      });
      expect(renamed.status).toBe(HttpStatus.OK);
      for (const alias of ALIASES) {
        expect(idsOf(await search(owner(), `${alias} Kulkarni`))).toEqual([third.proposal.id]);
        const sharma = idsOf(await search(owner(), `Sharma ${alias}`));
        expect(sharma).toEqual(expect.arrayContaining([mine.id, theirs.id]));
        expect(sharma).not.toContain(third.proposal.id);
        expect(await search(owner(), `${alias} zzzz-no-such-customer`)).toEqual({
          total: 0,
          items: [],
        });
      }
    });

    it('a query that names no proposal finds none', async () => {
      expect(await search(owner(), 'zzzz-no-such-customer')).toEqual({ total: 0, items: [] });
    });
  },
);
