import { acceptanceRecord, lead, project, proposal, task } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { noticesOf, timelineOf } from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  aLead,
  answerOn,
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
  storedEntriesOf,
} from './support';

/**
 * What the customer does on their link (`T-F5-001`, `T-F5-008`, `T-M06-025`, `T-M06-030`; `F5-43`…
 * `F5-49`, `F5-52`…`F5-54`, `M06-45`, `M06-55`): an answer is recorded once per version, with its
 * acceptance evidence, the tasks it moves and the people it tells — and a person still confirms
 * the win.
 */

const here = aStaffedCompany('Link Acts EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'CUSTOMER LINK ACTS PROOF',
  'Accept, negotiate and decline are UNPROVEN in this run.',
);

const MINUTE_MS = 60_000;

describe.skipIf(skip)(
  'A customer’s acts on their link, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const sellerId = () => here.people.seller.userId;
    const ownerId = () => here.people.owner.userId;
    const db = () => world.pools.admin.db;

    /** A shared proposal on a lead the seller holds, with the customer's token. */
    const aSharedDeal = async () => {
      const leadId = await aLead(owner());
      await ownLead(world, leadId, sellerId());
      const shared = await aShared(owner(), leadId);
      const { link, token } = await customersLink(owner(), leadId);
      return { leadId, proposalId: shared.id, link, token };
    };
    const leadRow = async (leadId: string) =>
      (
        await db()
          .select({ stage: lead.stage, state: lead.lifecycleState })
          .from(lead)
          .where(eq(lead.id, leadId))
      )[0];
    const statusOf = async (proposalId: string) =>
      (
        await db()
          .select({ status: proposal.status })
          .from(proposal)
          .where(eq(proposal.id, proposalId))
      )[0]?.status;
    const tasksOf = (leadId: string) => db().select().from(task).where(eq(task.leadId, leadId));
    const openTask = async (leadId: string, provenance: string) =>
      (await tasksOf(leadId)).filter(
        (one) => one.provenance === provenance && one.status === 'open',
      );

    beforeAll(async () => {
      world = await openProposalsWorld([here]);
    });

    afterAll(async () => {
      await world.close();
    });

    it('an Accept records the acceptance with its evidence, tells the rep and the owner, and wins nothing (F5-43, F5-46, F5-49)', async () => {
      const deal = await aSharedDeal();
      const before = await pageOf(world, deal.token);
      expect(before.body.proposal).toMatchObject({ mayRespond: true, answer: null });

      const reply = await linkAct(world, deal.token, 'accept', await answerOn(world, deal.token), {
        'user-agent': 'Anil-phone/1.0',
      });
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.proposal).toMatchObject({ mayRespond: false, answer: { kind: 'accept' } });

      const [record] = await db()
        .select()
        .from(acceptanceRecord)
        .where(eq(acceptanceRecord.proposalId, deal.proposalId));
      expect(record).toMatchObject({
        linkId: deal.link.id,
        contactId: null,
        challenge: 'off',
        userAgent: 'Anil-phone/1.0',
      });
      expect(record?.networkAddress).not.toBe('');
      expect(record?.tokenId).toBeTruthy();

      expect(await statusOf(deal.proposalId)).toBe('accepted');
      // The customer's tap never wins the deal: a person confirms it (`F5-49`, `M06-45`).
      expect(await leadRow(deal.leadId)).toEqual({ stage: 'proposal', state: null });
      expect(await db().select().from(project).where(eq(project.leadId, deal.leadId))).toEqual([]);

      expect(await openTask(deal.leadId, 'proposal_shared')).toEqual([]);
      const [confirm] = await openTask(deal.leadId, 'proposal_accepted');
      expect(confirm).toMatchObject({ assigneeUserId: sellerId(), title: deal.link.label });
      expect(Math.abs((confirm?.dueAt.getTime() ?? 0) - Date.now())).toBeLessThan(MINUTE_MS);

      for (const who of [sellerId(), ownerId()]) {
        expect(await noticesOf(world, who, deal.proposalId)).toMatchObject([
          { type: 'proposal_accepted' },
        ]);
      }
      const audited = await auditEntriesOf(world, here.company.tenantId, 'customer_link.accepted');
      expect(audited.filter((entry) => entry.subjectRef === deal.proposalId)).toMatchObject([
        { actorKind: 'customer_link', actorRef: deal.link.id },
      ]);
      const entries = await storedEntriesOf(world, deal.leadId);
      expect(entries.filter((entry) => entry.kind === 'proposal_accepted')).toMatchObject([
        { actorKind: 'customer', actorRef: null },
      ]);
      // And the timeline reads it back as the customer's own act, on the wire's shape.
      const read = (await timelineOf(owner(), deal.leadId)).items.find(
        (entry) => entry.kind === 'proposal_accepted',
      );
      expect(read).toMatchObject({ actor: { kind: 'customer' } });
    });

    it('two answers sent at once record exactly one (F5-43)', async () => {
      const deal = await aSharedDeal();
      const on = await answerOn(world, deal.token);
      const held = await holdLock(sql`select 1 from lead where id = ${deal.leadId} for update`);
      const both = [
        linkAct(world, deal.token, 'accept', on),
        linkAct(world, deal.token, 'decline', { ...on, reason: null }),
      ];
      await held.waitForWaiters(2);
      await held.release();
      const statuses = (await Promise.all(both)).map((reply) => reply.status).sort();
      expect(statuses).toEqual([HttpStatus.OK, HttpStatus.UNPROCESSABLE_ENTITY]);
      const answers = (await eventsOf(world, deal.link.id)).filter(
        (one) => one.eventType !== 'opened',
      );
      expect(answers).toHaveLength(1);
    });

    it('a change request keeps the customer’s words, moves the lead to negotiating and tells the rep (F5-50, M06-45)', async () => {
      const deal = await aSharedDeal();
      const words = 'कृपया 5 kW का दाम बताइए';
      const on = await answerOn(world, deal.token);
      const reply = await linkAct(world, deal.token, 'negotiate', { ...on, words });
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.proposal?.answer).toMatchObject({ kind: 'negotiate', words });
      expect(await leadRow(deal.leadId)).toEqual({ stage: 'negotiating', state: null });
      // No answer to chase: the follow-up stays, since the next act is the rep's new version.
      expect(await openTask(deal.leadId, 'proposal_shared')).toHaveLength(1);
      expect(await noticesOf(world, sellerId(), deal.proposalId)).toMatchObject([
        { type: 'negotiation_requested', body: words },
      ]);
    });

    it('a Decline closes the chase, raises the call, tells the owner too, and never marks the lead lost (F5-51, M06-55)', async () => {
      const deal = await aSharedDeal();
      const reply = await linkAct(world, deal.token, 'decline', {
        ...(await answerOn(world, deal.token)),
        reason: 'Too costly',
      });
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.proposal?.answer).toMatchObject({ kind: 'decline', words: 'Too costly' });
      expect(await statusOf(deal.proposalId)).toBe('declined');
      expect((await leadRow(deal.leadId))?.state).toBeNull();
      expect(await openTask(deal.leadId, 'proposal_shared')).toEqual([]);
      expect(await openTask(deal.leadId, 'proposal_accepted')).toEqual([]);
      expect(await openTask(deal.leadId, 'proposal_declined')).toMatchObject([
        { assigneeUserId: sellerId() },
      ]);
      for (const who of [sellerId(), ownerId()]) {
        expect(await noticesOf(world, who, deal.proposalId)).toMatchObject([
          { type: 'proposal_declined' },
        ]);
      }
    });
  },
);
