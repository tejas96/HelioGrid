import { randomUUID } from 'node:crypto';
import type { LeadDetail } from '@heliogrid/contracts';
import { task } from '@heliogrid/db';
import { callBackDueAt, callBackWindowOf, FOUNDER_ROLE, IN_CALLING_RULES } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { raiseFirstCallBack } from '../../src/modules/crm/crm.raised-tasks.repository';
import { skipWithoutDatabase } from '../support/fixture';
import { dayFromToday, KOLKATA, logged, onTheClock, tasksOf } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  entriesOfKind,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * The attempt log and the dial block (`M02-15`, `M02-43`, `M02-44`, T-M02-010): an unanswered call
 * is an attempt with one retry inside the calling window, and a wrong number stops every dial to
 * that number — in this company only.
 */

const here = aStaffedCompany('Calls EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
});
const elsewhere = aStaffedCompany('Other Calls EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'CALLS PROOF',
  'The attempt log is UNPROVEN on the wire in this run.',
);

const WINDOW = callBackWindowOf(IN_CALLING_RULES, null);
/** The api's clock and this process's may differ by this much. */
const CLOCK_SLACK_MS = 1_000;
/** A day well ahead, so its 09:00 is never the real clock's. */
const A_LATER_DAY = 3;
const now = () => new Date().toISOString();

describe.skipIf(skip)('calls on a lead, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const rep = () => world.as(here.members.rep);

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('an unanswered call logs an attempt, schedules one retry and raises the failed-try count', async () => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Ravi Patil' }));
    await ownLead(world, made.lead.id, here.people.rep.userId);
    const before = Date.now();
    const first = await logged(rep(), made.lead.id, 'no_answer');
    const after = Date.now();
    expect(first.unansweredCalls).toBe(1);
    expect(first.lead.stage).toBe('new');
    const [attempt] = await entriesOfKind(world, made.lead.id, 'call');
    expect(attempt?.body).toEqual({ outcome: 'no_answer', note: null });
    const retries = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.provenance === 'retry_after_no_answer',
    );
    expect(retries).toHaveLength(1);
    const [retry] = retries;
    expect(retry).toMatchObject({
      kind: 'call',
      status: 'open',
      assigneeUserId: here.people.rep.userId,
    });
    // Due at the next moment the calling window lets stand, never before the call was logged.
    const due = retry?.dueAt.getTime() ?? 0;
    expect(callBackDueAt(due, KOLKATA, WINDOW)).toBe(due);
    expect(due).toBeGreaterThanOrEqual(before - CLOCK_SLACK_MS);
    expect(due).toBeLessThanOrEqual(callBackDueAt(after, KOLKATA, WINDOW));

    const second = await logged(rep(), made.lead.id, 'no_answer');
    expect(second.unansweredCalls).toBe(2);
    const open = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.provenance === 'retry_after_no_answer' && one.status === 'open',
    );
    expect(open).toHaveLength(1);

    const answered = await logged(rep(), made.lead.id, 'answered');
    expect(answered.unansweredCalls).toBe(0);
    expect(answered.lead.stage).toBe('contacted');
  });

  it('a wrong-number disqualification removes every dial offer for that number', async () => {
    const phone = aPhone();
    const first = await captured(owner(), aCapture(phone, { name: 'Wrong One' }));
    const kept = await captured(
      owner(),
      aCapture(phone, {
        name: 'Same Number',
        keepBoth: { otherCustomerId: first.customer.id, reason: 'Two families, one phone' },
      }),
    );
    const theirs = await captured(world.as(elsewhere.members.owner), aCapture(phone));
    await ownLead(world, first.lead.id, here.people.owner.userId);
    await logged(owner(), first.lead.id, 'no_answer');
    expect(first.canDial).toBe(true);

    const reply = await owner().call<LeadDetail>('POST', `/leads/${first.lead.id}/disqualify`, {
      reason: 'wrong_number',
      capturedAt: now(),
    });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.lead.state).toBe('disqualified');
    expect(reply.body.canDial).toBe(false);
    expect(reply.body.openTasks.filter((one) => one.kind === 'call')).toEqual([]);
    const sibling = await owner().call<LeadDetail>('GET', `/leads/${kept.lead.id}`);
    expect(sibling.body.canDial).toBe(false);
    // Nothing schedules a dial either: a further unanswered call on the sibling raises no retry.
    await ownLead(world, kept.lead.id, here.people.owner.userId);
    await logged(owner(), kept.lead.id, 'no_answer');
    const dials = (await tasksOf(world, kept.lead.id)).filter((one) => one.kind === 'call');
    expect(dials.filter((one) => one.status === 'open')).toEqual([]);
    // Another company's customer with the same number is theirs to dial.
    const other = await world
      .as(elsewhere.members.owner)
      .call<LeadDetail>('GET', `/leads/${theirs.lead.id}`);
    expect(other.body.canDial).toBe(true);
  });

  it.each([
    ['22:10', 'the next morning at 09:00', 1],
    ['06:30', 'that morning at 09:00', 0],
  ])('a lead captured at %s waits for its call-back until %s', async (hhmm, _when, dayAfter) => {
    const made = await captured(owner(), aCapture(aPhone()));
    const day = dayFromToday(A_LATER_DAY);
    const at = onTheClock(day, hhmm);
    await world.pools.tenants.withTenantTransaction(here.company.tenantId, (tx) =>
      raiseFirstCallBack(tx, {
        tenantId: here.company.tenantId,
        leadId: made.lead.id,
        act: { actorUserId: here.people.owner.userId, now: at },
        window: WINDOW,
      }),
    );
    // The capture itself raised one by the real clock; this proof reads the one raised at `at`.
    const [callBack] = await world.pools.admin.db
      .select()
      .from(task)
      .where(and(eq(task.leadId, made.lead.id), eq(task.createdAt, new Date(at))));
    expect(callBack).toMatchObject({ kind: 'call', assigneeUserId: here.people.owner.userId });
    expect(callBack?.dueAt.getTime()).toBe(
      onTheClock(dayFromToday(A_LATER_DAY + dayAfter), '09:00'),
    );
  });

  it('a lead captured inside the calling window raises no call-back task', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const at = onTheClock(dayFromToday(A_LATER_DAY), '11:00');
    await world.pools.tenants.withTenantTransaction(here.company.tenantId, (tx) =>
      raiseFirstCallBack(tx, {
        tenantId: here.company.tenantId,
        leadId: made.lead.id,
        act: { actorUserId: here.people.owner.userId, now: at },
        window: WINDOW,
      }),
    );
    const raisedThen = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.createdAt.getTime() === at,
    );
    expect(raisedThen).toEqual([]);
  });

  it('a call on a lead outside the reader’s scope or company is not found', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people.owner.userId);
    const body = { outcome: 'answered', capturedAt: now() };
    expect((await rep().call('POST', `/leads/${made.lead.id}/calls`, body)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    const stranger = world.as(elsewhere.members.owner);
    expect(
      (
        await stranger.call('POST', `/leads/${made.lead.id}/notes`, {
          text: 'x',
          capturedAt: now(),
        })
      ).status,
    ).toBe(HttpStatus.NOT_FOUND);
    expect((await rep().call('POST', `/leads/${randomUUID()}/calls`, body)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
  });
});
