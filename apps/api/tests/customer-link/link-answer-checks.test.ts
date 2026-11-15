import { acceptanceRecord, proposal, proposalVersion } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aLead,
  answerOn,
  anyVersion,
  aShared,
  aStaffedCompany,
  customersLink,
  detailOf,
  edited,
  eventsOf,
  generate,
  linkAct,
  openProposalsWorld,
  type ProposalsWorld,
  pageOf,
  refusalOf,
  share,
  systemOf,
} from './support';

/**
 * What the server re-checks before it records a customer's answer (`T-F5-001`; `F5-47`, `M06-45`):
 * the version the page showed is the one the link serves now, it has no answer yet, and an Accept
 * stands only on figures still current. A refusal records nothing.
 */

const here = aStaffedCompany('Link Answer Checks EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CUSTOMER LINK ANSWER CHECKS PROOF',
  'The re-checks before an answer is recorded are UNPROVEN in this run.',
);

describe.skipIf(skip)(
  'The checks before a customer’s answer is recorded, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const db = () => world.pools.admin.db;

    /** A shared proposal with the customer's token. */
    const aSharedDeal = async () => {
      const leadId = await aLead(owner());
      const shared = await aShared(owner(), leadId);
      const { link, token } = await customersLink(owner(), leadId);
      return { leadId, proposalId: shared.id, link, token };
    };
    const statusOf = async (proposalId: string) =>
      (
        await db()
          .select({ status: proposal.status })
          .from(proposal)
          .where(eq(proposal.id, proposalId))
      )[0]?.status;

    beforeAll(async () => {
      world = await openProposalsWorld([here]);
    });

    afterAll(async () => {
      await world.close();
    });

    it('a version takes one answer: a second is refused and records nothing (F5-47, M06-45)', async () => {
      const deal = await aSharedDeal();
      const on = await answerOn(world, deal.token);
      expect((await linkAct(world, deal.token, 'accept', on)).status).toBe(HttpStatus.OK);

      for (const [act, body] of [
        ['accept', on],
        ['negotiate', { ...on, words: 'A lower price, please' }],
        ['decline', { ...on, reason: null }],
      ] as const) {
        const again = await linkAct(world, deal.token, act, body);
        expect(again.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(refusalOf(again)).toBe('already_answered');
      }
      const answers = (await eventsOf(world, deal.link.id)).filter(
        (one) => one.eventType !== 'opened',
      );
      expect(answers).toHaveLength(1);
      expect(await statusOf(deal.proposalId)).toBe('accepted');
    });

    it('an answer on a version the link no longer serves is refused (F5-47)', async () => {
      const deal = await aSharedDeal();
      const stale = await linkAct(world, deal.token, 'accept', anyVersion);
      expect(stale.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(refusalOf(stale)).toBe('version_not_current');
      expect(await statusOf(deal.proposalId)).toBe('shared');
      expect(
        await db()
          .select()
          .from(acceptanceRecord)
          .where(eq(acceptanceRecord.proposalId, deal.proposalId)),
      ).toEqual([]);
    });

    it('an Accept from a page still showing an earlier proposal is refused once another proposal is shared, and records nothing (F5-47)', async () => {
      const deal = await aSharedDeal();
      const oldPage = await answerOn(world, deal.token);
      const other = await aShared(owner(), deal.leadId);
      expect(other.id).not.toBe(deal.proposalId);

      for (const [act, body] of [
        ['accept', oldPage],
        ['negotiate', { ...oldPage, words: 'A lower price, please' }],
        ['decline', { ...oldPage, reason: null }],
      ] as const) {
        const reply = await linkAct(world, deal.token, act, body);
        expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(refusalOf(reply)).toBe('version_not_current');
      }
      expect(await statusOf(other.id)).toBe('shared');
      expect(
        await db()
          .select()
          .from(acceptanceRecord)
          .where(inArray(acceptanceRecord.proposalId, [deal.proposalId, other.id])),
      ).toEqual([]);
    });

    it('an Accept on figures no longer current is refused and records nothing; a decline still stands (F5-47, F8-12)', async () => {
      const deal = await aSharedDeal();
      const on = await answerOn(world, deal.token);
      // The version was computed by an engine this build no longer runs: its figures are stale.
      await db()
        .update(proposalVersion)
        .set({ pins: { engines: { proposal: '0' } } })
        .where(eq(proposalVersion.id, on.versionId));

      const stale = await linkAct(world, deal.token, 'accept', on);
      expect(stale.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(refusalOf(stale)).toBe('figures_not_current');
      expect(await statusOf(deal.proposalId)).toBe('shared');
      expect(
        await db()
          .select()
          .from(acceptanceRecord)
          .where(eq(acceptanceRecord.proposalId, deal.proposalId)),
      ).toEqual([]);
      const declined = await linkAct(world, deal.token, 'decline', { ...on, reason: null });
      expect(declined.status).toBe(HttpStatus.OK);
    });

    it('a newer shared version is served at the same address and takes its own answer (F5-40, M06-45)', async () => {
      const deal = await aSharedDeal();
      const first = await answerOn(world, deal.token);
      expect((await linkAct(world, deal.token, 'accept', first)).status).toBe(HttpStatus.OK);

      const detail = (await detailOf(owner(), deal.proposalId)).body;
      const changed = await edited(owner(), detail, {
        fields: { system: systemOf(detail, { priceInclusive: '185000.00' }) },
      });
      const second = await generate(owner(), changed, { changeNote: 'A lower price, as asked' });
      expect(second.status).toBe(HttpStatus.CREATED);
      // Only generated: the customer still reads version 1, with its answer.
      expect((await pageOf(world, deal.token)).body.proposal?.document.version).toBe(1);

      expect((await share(owner(), deal.proposalId)).status).toBe(HttpStatus.OK);
      const page = await pageOf(world, deal.token);
      expect(page.body.proposal).toMatchObject({ mayRespond: true, answer: null });
      expect(page.body.proposal?.document.version).toBe(2);
      expect(refusalOf(await linkAct(world, deal.token, 'accept', first))).toBe(
        'version_not_current',
      );
      const newer = await answerOn(world, deal.token);
      expect((await linkAct(world, deal.token, 'accept', newer)).status).toBe(HttpStatus.OK);
    });
  },
);
