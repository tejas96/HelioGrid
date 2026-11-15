import type { ProposalList } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dashboardOf } from '../dashboards/support';
import {
  aNewerVersion,
  aWonAcceptedDeal,
  type HandoffTeam,
  putInForce,
} from '../projects/handoff-support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aGenerated,
  aStaffedCompany,
  type Caller,
  detailOf,
  openProposalsWorld,
  type ProposalsWorld,
  preset,
  refusalOf,
  share,
} from './support';

/**
 * A won deal's proposal is no longer open (`M06-45`, `T-M13-007`, `T-M06-019`): a later version
 * shared on it so it can be put in force reads won — on the list, on Track — and is counted by
 * none of the owner home's "not opened", forecast or stage values, nor the list's waiting chip and
 * total, before the version is put in force and after. Once Won the link serves the project, so
 * that version can never be opened, and it would wait in "what needs you" for ever.
 */

const here = aStaffedCompany('Won Deal Standing EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'WON DEAL STANDING PROOF',
  'A proposal shared again on a won deal is UNPROVEN to leave every open count in this run.',
);

describe.skipIf(skip)(
  'a version shared on a won deal, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const pm = () => world.as(here.members.pm);
    const team = (): HandoffTeam => ({
      owner: owner(),
      seller: world.as(here.members.seller),
      sellerId: here.people.seller.userId,
      managerId: here.people.pm.userId,
    });
    const listOf = async (caller: Caller, query = '') => {
      const reply = await caller.call<ProposalList>('GET', `/proposals${query}`);
      expect(reply.status).toBe(HttpStatus.OK);
      return reply.body;
    };

    beforeAll(async () => {
      world = await openProposalsWorld([here]);
    });

    afterAll(async () => {
      await world.close();
    });

    /** Nothing of this company is open: its one proposal is the won deal's. */
    const expectNothingOpen = async (proposalId: string) => {
      const home = await dashboardOf(owner());
      expect(home.needsYou.proposalsUnopened).toEqual({ count: 0, oldest: null });
      expect(home.forecast).toMatchObject({ count: 0, expected: '0.00' });
      expect(home.pipeline.every((row) => row.value === null)).toBe(true);

      const list = await listOf(owner());
      expect(list.rows.items.find((row) => row.id === proposalId)?.standing).toBe('won');
      expect(list.counts).toMatchObject({ waiting: 0, accepted: 1 });
      expect(list.waitingValue).toBe('0.00');
      expect((await listOf(owner(), '?filter=waiting')).rows.items).toEqual([]);
      const accepted = (await listOf(owner(), '?filter=accepted')).rows.items;
      expect(accepted.map((row) => row.id)).toEqual([proposalId]);
      expect((await detailOf(owner(), proposalId)).body.standing).toBe('won');
    };

    it('reads won and counts nowhere open, once shared and again once put in force', async () => {
      const deal = await aWonAcceptedDeal(world, team());
      await aNewerVersion(owner(), deal.proposalId, '305000.00');
      const shared = await share(owner(), deal.proposalId);
      expect(shared.status).toBe(HttpStatus.OK);
      expect(shared.body.proposal.status).toBe('shared');
      await expectNothingOpen(deal.proposalId);

      expect((await putInForce(pm(), deal.projectId, 2)).status).toBe(HttpStatus.OK);
      await expectNothingOpen(deal.proposalId);
    });

    it('a won deal has no collision: nothing reads live, and its proposal is not withdrawn (M06-58)', async () => {
      const deal = await aWonAcceptedDeal(world, team());
      const other = await aGenerated(owner(), deal.leadId);
      const detail = await owner().call<{
        proposals: { items: { id: string; live: boolean; standing: string }[] };
      }>('GET', `/leads/${deal.leadId}`);
      expect(detail.body.proposals.items.filter((item) => item.live)).toEqual([]);
      expect(
        detail.body.proposals.items.find((item) => item.id === deal.proposalId)?.standing,
      ).toBe('won');

      for (const proposalId of [deal.proposalId, other.proposal.id]) {
        const withdrawn = await owner().call('POST', `/proposals/${proposalId}/withdraw`, {
          capturedAt: new Date().toISOString(),
        });
        expect(refusalOf(withdrawn)).toBe('deal_won');
      }
      expect((await detailOf(owner(), deal.proposalId)).body.standing).toBe('won');
    });
  },
);
