import {
  callbackRequest,
  customerQuestion,
  lead,
  leadStageTransition,
  proposal,
  task,
} from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dayFromToday } from '../crm/lead-work';
import { noticesOf } from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aLead,
  answerOn,
  aShared,
  aStaffedCompany,
  customersLink,
  linkAct,
  openProposalsWorld,
  ownLead,
  type ProposalsWorld,
  preset,
  storedEntriesOf,
} from './support';

/**
 * What the customer does on their link (`T-F5-001`, `T-F5-008`, `T-M06-025`, `T-M06-030`; `F5-43`…
 * `F5-49`, `F5-52`…`F5-54`, `M06-45`, `M06-55`): an answer is recorded once per version, with its
 * acceptance evidence, the tasks it moves and the people it tells — and a person still confirms
 * the win.
 */

const here = aStaffedCompany('Link Asks EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'CUSTOMER LINK ASKS PROOF',
  'Questions, call requests and the wake of a parked lead are UNPROVEN in this run.',
);

const MINUTE_MS = 60_000;
const MINUTES_PER_DAY = 1_440;
const SNOOZE_DAYS = 5;

describe.skipIf(skip)(
  'What a customer asks on their link, over HTTP against a migrated database',
  () => {
    let world: ProposalsWorld;
    const owner = () => world.as(here.members.owner);
    const sellerId = () => here.people.seller.userId;
    const _ownerId = () => here.people.owner.userId;
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
    const _statusOf = async (proposalId: string) =>
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

    it('a question is kept as written, shown as received, and raises a call task and a notice (F5-52, F5-53)', async () => {
      const deal = await aSharedDeal();
      const text = 'Who cleans the panels?';
      const reply = await linkAct(world, deal.token, 'questions', { text });
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.questions).toMatchObject([{ text, state: 'received' }]);
      expect(
        await db().select().from(customerQuestion).where(eq(customerQuestion.leadId, deal.leadId)),
      ).toMatchObject([{ questionText: text, phase: 'proposal' }]);
      expect(await openTask(deal.leadId, 'customer_question')).toMatchObject([
        { kind: 'call', assigneeUserId: sellerId() },
      ]);
      expect(await noticesOf(world, sellerId(), deal.leadId)).toMatchObject([
        { type: 'customer_question', body: text },
      ]);
      const entries = await storedEntriesOf(world, deal.leadId);
      expect(entries.filter((entry) => entry.kind === 'customer_question')).toMatchObject([
        { actorKind: 'customer' },
      ]);
    });

    it('a call request is the customer’s consent: one open call task per lead, moved by a second request (F5-54)', async () => {
      const deal = await aSharedDeal();
      const tomorrow = new Date(Date.now() + MINUTES_PER_DAY * MINUTE_MS).toISOString();
      const first = await linkAct(world, deal.token, 'call-requests', { at: null });
      expect(first.status).toBe(HttpStatus.OK);
      expect(first.body.proposal?.callRequest).not.toBeNull();
      const second = await linkAct(world, deal.token, 'call-requests', { at: tomorrow });
      expect(second.status).toBe(HttpStatus.OK);

      const calls = await openTask(deal.leadId, 'customer_call_request');
      expect(calls).toMatchObject([{ kind: 'call', assigneeUserId: sellerId() }]);
      expect(calls[0]?.dueAt.toISOString()).toBe(tomorrow);
      const requests = await db()
        .select()
        .from(callbackRequest)
        .where(eq(callbackRequest.leadId, deal.leadId));
      expect(requests).toHaveLength(2);
      expect(requests.every((request) => request.taskId === calls[0]?.id)).toBe(true);
    });

    it.each([
      ['a question', 'questions', { text: 'Still interested' }],
      ['a call request', 'call-requests', { at: null }],
      ['an Accept', 'accept', null],
    ])(
      '%s wakes a snoozed lead as activity, never as a person’s act, so its task is never hidden (M02-51, T-F5-008)',
      async (_act, act, body) => {
        const deal = await aSharedDeal();
        const snoozed = await owner().call('POST', `/leads/${deal.leadId}/snooze`, {
          wakeOn: dayFromToday(SNOOZE_DAYS),
          capturedAt: new Date().toISOString(),
        });
        expect(snoozed.status).toBe(HttpStatus.OK);
        expect((await leadRow(deal.leadId))?.state).toBe('snoozed');

        const sent = body ?? (await answerOn(world, deal.token));
        expect((await linkAct(world, deal.token, act, sent)).status).toBe(HttpStatus.OK);
        expect((await leadRow(deal.leadId))?.state).toBeNull();
        const [woken] = await db()
          .select({ cause: leadStageTransition.cause, by: leadStageTransition.movedBy })
          .from(leadStageTransition)
          .where(
            and(
              eq(leadStageTransition.leadId, deal.leadId),
              eq(leadStageTransition.fromState, 'snoozed'),
            ),
          );
        expect(woken).toEqual({ cause: 'automation', by: null });
        const [touched] = await db()
          .select({ at: lead.lastActivityAt })
          .from(lead)
          .where(and(eq(lead.id, deal.leadId)));
        expect(Math.abs((touched?.at.getTime() ?? 0) - Date.now())).toBeLessThan(MINUTE_MS);
      },
    );
  },
);
