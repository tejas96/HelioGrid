import { projectDocument, projectTranche, task } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aLead,
  aStaffedCompany,
  aWin,
  markWon,
  openProposalsWorld,
  type ProposalsWorld,
  preset,
  detailOf as proposalOf,
  refusalOf,
  share,
} from '../customer-link/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  ACCEPTED_PAYABLE,
  aNewerVersion,
  anAcceptedDeal,
  aWonAcceptedDeal,
  basisOf,
  type HandoffTeam,
  paise,
  sumOf,
} from './handoff-support';
import { paymentsOf } from './payments-support';
import { detailOf } from './support';

/**
 * Where a proposal meets its project, on the wire (`T-M06-025` b; `M07-62`, `M08-50`, `M11-14`,
 * `F5-46`): Mark won takes the accepted version's value and plan and refuses any other value; a
 * deal with nothing accepted keeps the typed value and the company's terms; and a newer version is
 * put in force by the lead's owner or the project's manager alone, with every receipt kept.
 */

const here = aStaffedCompany('Proposal Handoff EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  seller: [preset.sales_executive],
  colleague: [preset.sales_executive],
});
const there = aStaffedCompany('Proposal Handoff Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROPOSAL HAND-OFF PROOF',
  'Mark won from an accepted proposal and a version put in force are UNPROVEN in this run.',
);

describe.skipIf(skip)(
  'a proposal handed to its project, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const pm = () => world.as(here.members.pm);
    const seller = () => world.as(here.members.seller);
    const pmId = () => here.people.pm.userId;
    const db = () => world.pools.admin.db;
    const _tenantId = () => here.company.tenantId;

    beforeAll(async () => {
      world = await openProposalsWorld([here, there]);
    });

    afterAll(async () => {
      await world.close();
    });

    const team = (): HandoffTeam => ({
      owner: owner(),
      seller: seller(),
      sellerId: here.people.seller.userId,
      managerId: pmId(),
    });
    const anAccepted = () => anAcceptedDeal(world, team());
    const aWonAccepted = () => aWonAcceptedDeal(world, team());

    describe('what Mark won opens on (M07-62)', () => {
      it('a lead with no proposal opens on a typed value and the company’s own terms', async () => {
        const leadId = await aLead(owner());
        const reply = await basisOf(owner(), leadId);
        expect(reply.status).toBe(HttpStatus.OK);
        expect(reply.body).toMatchObject({
          basis: 'no_acceptance',
          proposal: null,
          acceptance: null,
          unansweredVersion: null,
          finalValue: null,
          siblingProposal: null,
        });
        expect(reply.body.plan.every((part) => part.amount === null)).toBe(true);
      });

      it('an accepted latest version fills the value, the plan row for row, and its proof', async () => {
        const deal = await anAccepted();
        const reply = await basisOf(seller(), deal.leadId);
        expect(reply.status).toBe(HttpStatus.OK);
        expect(reply.body).toMatchObject({
          basis: 'accepted_version',
          proposal: { id: deal.proposalId },
          acceptance: { version: 1, contactName: null },
          unansweredVersion: null,
          finalValue: ACCEPTED_PAYABLE,
        });
        expect(reply.body.proposal?.number).toMatch(/^PRP-\d{4,}$/);
        expect(reply.body.acceptance?.linkLabel).not.toBe('');
        const version = (await proposalOf(owner(), deal.proposalId)).body.document.money?.tranches;
        expect(reply.body.plan).toEqual(version);
        expect(sumOf(reply.body.plan.map((part) => part.amount ?? '0'))).toBe(
          paise(ACCEPTED_PAYABLE),
        );
      });

      it('an accepted version with a newer one shared and unanswered leaves the value typed', async () => {
        const deal = await anAccepted();
        const second = await aNewerVersion(owner(), deal.proposalId, '210000.00');
        expect((await share(owner(), second.proposal.id)).status).toBe(HttpStatus.OK);
        const reply = await basisOf(seller(), deal.leadId);
        expect(reply.body).toMatchObject({
          basis: 'newer_version_unanswered',
          acceptance: { version: 1 },
          unansweredVersion: 2,
          finalValue: null,
        });
        expect(reply.body.plan.every((part) => part.amount === null)).toBe(true);
        // The typed value stands, and the project says it runs on no accepted proposal.
        const won = await markWon(seller(), deal.leadId, aWin(pmId(), { finalValue: '205000.00' }));
        expect(won.status).toBe(HttpStatus.CREATED);
        expect((await detailOf(pm(), won.body.projectId)).body.proposalVersion).toBeNull();
      });

      it('only who may mark won reads it, in their own lead scope, in their own company', async () => {
        const deal = await anAccepted();
        expect((await basisOf(seller(), deal.leadId)).status).toBe(HttpStatus.OK);
        expect((await basisOf(owner(), deal.leadId)).status).toBe(HttpStatus.OK);
        expect((await basisOf(pm(), deal.leadId)).status).toBe(HttpStatus.FORBIDDEN);
        const colleague = await basisOf(world.as(here.members.colleague), deal.leadId);
        expect(colleague.status).toBe(HttpStatus.NOT_FOUND);
        const stranger = await basisOf(world.as(there.members.owner), deal.leadId);
        expect(stranger.status).toBe(HttpStatus.NOT_FOUND);
      });
    });

    describe('Mark won on an accepted proposal (M07-62, M11-09, F5-46)', () => {
      it.each([
        ['a rupee more', '190576.00'],
        ['a paisa less', '190574.99'],
      ])(
        'refuses a final value that is not the accepted payable — %s — and makes no project',
        async (_, finalValue) => {
          const deal = await anAccepted();
          const reply = await markWon(seller(), deal.leadId, aWin(pmId(), { finalValue }));
          expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
          expect(refusalOf(reply)).toBe('value_not_accepted_version');
          expect((await basisOf(seller(), deal.leadId)).body.basis).toBe('accepted_version');
        },
      );

      it('takes the version’s own plan to the paisa, names the version, and closes the chase', async () => {
        const deal = await aWonAccepted();
        const detail = (await detailOf(pm(), deal.projectId)).body;
        expect(detail.proposalVersion).toMatchObject({ proposalId: deal.proposalId, version: 1 });
        expect(detail.proposalId).toBe(deal.proposalId);
        expect(detail.newerVersion).toBeNull();

        const agreed =
          (await proposalOf(owner(), deal.proposalId)).body.document.money?.tranches ?? [];
        const money = await paymentsOf(owner(), deal.projectId);
        expect(money.parts.map((part) => [part.label, part.amount])).toEqual(
          agreed.map((part) => [part.label, part.amount]),
        );
        expect(sumOf(money.parts.map((part) => part.amount))).toBe(paise(ACCEPTED_PAYABLE));
        const rows = await db()
          .select({ source: projectTranche.source })
          .from(projectTranche)
          .where(eq(projectTranche.projectId, deal.projectId));
        expect(rows.every((row) => row.source === 'proposal_version')).toBe(true);

        // The acceptance is the signed-proposal row's proof: nobody uploads a paper for it.
        const [signed] = await db()
          .select({ state: projectDocument.state, changedBy: projectDocument.changedBy })
          .from(projectDocument)
          .where(
            and(
              eq(projectDocument.projectId, deal.projectId),
              eq(projectDocument.rowKey, 'signed_proposal'),
            ),
          );
        expect(signed).toEqual({ state: 'done', changedBy: null });
        // …and the row says so on the wire: the version, the link, when, by the customer's Accept (`F5-46`).
        const row = detail.documents.find((one) => one.row === 'signed_proposal');
        expect(row?.proof).toEqual({
          version: 1,
          linkLabel: expect.any(String),
          at: expect.any(String),
          act: 'accepted',
        });

        // Mark won closes every proposal task on the lead (`M06-55`).
        const open = (await db().select().from(task).where(eq(task.leadId, deal.leadId))).filter(
          (one) => one.status === 'open' && one.provenance.startsWith('proposal_'),
        );
        expect(open).toEqual([]);
      });

      it('a deal won with nothing accepted keeps the typed value and the company’s terms', async () => {
        const leadId = await aLead(owner());
        const won = await markWon(owner(), leadId, aWin(pmId(), { finalValue: '300000.00' }));
        expect(won.status).toBe(HttpStatus.CREATED);
        const detail = (await detailOf(pm(), won.body.projectId)).body;
        expect(detail).toMatchObject({
          proposalVersion: null,
          proposalId: null,
          newerVersion: null,
        });
        const rows = await db()
          .select({ source: projectTranche.source })
          .from(projectTranche)
          .where(eq(projectTranche.projectId, won.body.projectId));
        expect(rows.every((row) => row.source === 'payment_terms')).toBe(true);
        const [signed] = await db()
          .select({ state: projectDocument.state })
          .from(projectDocument)
          .where(
            and(
              eq(projectDocument.projectId, won.body.projectId),
              eq(projectDocument.rowKey, 'signed_proposal'),
            ),
          );
        expect(signed?.state).toBe('pending');
        expect(detail.documents.find((one) => one.row === 'signed_proposal')?.proof).toBeNull();
      });
    });
  },
);
