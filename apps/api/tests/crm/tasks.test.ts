import { randomUUID } from 'node:crypto';
import type { Task } from '@heliogrid/contracts';
import { customer, task } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { assignOne } from './assign-support';
import { aVisit, booked, tasksOf } from './lead-work';
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
  retryKey,
} from './support';

/**
 * Follow-up tasks (`M07-05`): a task lands on the lead's owner unless a person is
 * named, and only on an active member; no call is set for a number no one may dial (`M02-44`);
 * whoever holds it or may work its lead closes it, the timeline records it done, and a cancelled
 * task is history.
 */

const here = aStaffedCompany('Tasks EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
  surveyor: [preset.survey_engineer],
});
const elsewhere = aStaffedCompany('Other Tasks EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'TASKS PROOF',
  'Follow-up tasks are UNPROVEN on the wire in this run.',
);

const now = () => new Date().toISOString();
const tomorrow = () => new Date(Date.now() + MS_PER_DAY).toISOString();

describe.skipIf(skip)('follow-up tasks, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const add = (leadId: string, body: Record<string, unknown>) =>
    owner().call<Task>(
      'POST',
      `/leads/${leadId}/tasks`,
      { dueAt: tomorrow(), ...body },
      retryKey(),
    );

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a task goes to the lead’s owner unless a person is named, and only to an active member', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people.rep.userId);
    const mine = await add(made.lead.id, { kind: 'call' });
    expect(mine.status).toBe(HttpStatus.CREATED);
    expect(mine.body).toMatchObject({
      leadId: made.lead.id,
      kind: 'call',
      status: 'open',
      provenance: 'manual',
      assignee: { userId: here.people.rep.userId, name: here.people.rep.name },
    });
    const named = await add(made.lead.id, {
      kind: 'custom',
      title: 'Send the subsidy form',
      assigneeId: here.people.owner.userId,
    });
    expect(named.body.assignee.userId).toBe(here.people.owner.userId);
    const stranger = await add(made.lead.id, {
      kind: 'call',
      assigneeId: elsewhere.people.owner.userId,
    });
    expect(stranger.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(stranger.body).toMatchObject({ error: { code: 'ASSIGNEE_UNAVAILABLE' } });
    const custom = await add(made.lead.id, { kind: 'custom' });
    expect(custom.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it.each([
    ['a wrong number', () => ({ wrongNumberAt: new Date() })],
    [
      'do not call',
      () => ({ doNotCallSetAt: new Date(), doNotCallSetBy: here.people.owner.userId }),
    ],
  ])('no call task is set for %s, while a follow-up still is', async (_case, blocked) => {
    const made = await captured(owner(), aCapture(aPhone()));
    await world.pools.admin.db
      .update(customer)
      .set(blocked())
      .where(eq(customer.id, made.customer.id));
    const call = await add(made.lead.id, { kind: 'call' });
    expect({ status: call.status, body: call.body }).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      body: { error: { code: 'NUMBER_NOT_DIALLABLE', details: [{ path: 'kind' }] } },
    });
    expect((await add(made.lead.id, { kind: 'follow_up' })).status).toBe(HttpStatus.CREATED);
    const added = (await tasksOf(world, made.lead.id)).filter((one) => one.provenance === 'manual');
    expect(added.map((one) => one.kind)).toEqual(['follow_up']);
  });

  it('done is on the timeline, reopen opens it again, and a cancelled task cannot change', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const added = (await add(made.lead.id, { kind: 'follow_up' })).body;
    const done = await owner().call<Task>('POST', `/tasks/${added.id}/done`, { capturedAt: now() });
    expect(done.body).toMatchObject({ status: 'done' });
    expect(done.body.doneAt).not.toBeNull();
    const again = await owner().call<Task>('POST', `/tasks/${added.id}/done`, {
      capturedAt: now(),
    });
    expect(again.body.doneAt).toBe(done.body.doneAt);
    const entries = await entriesOfKind(world, made.lead.id, 'task_done');
    expect(entries.map((one) => one.body)).toEqual([
      { taskId: added.id, kind: 'follow_up', title: null },
    ]);
    const reopened = await owner().call<Task>('POST', `/tasks/${added.id}/reopen`, {
      capturedAt: now(),
    });
    expect(reopened.body).toMatchObject({ status: 'open', doneAt: null });
    await world.pools.admin.db
      .update(task)
      .set({ status: 'cancelled' })
      .where(eq(task.id, added.id));
    const cancelled = await owner().call('POST', `/tasks/${added.id}/done`, { capturedAt: now() });
    expect(cancelled.status).toBe(HttpStatus.CONFLICT);
  });

  it('a task done while its lead is handed over waits for the hand-over, never a deadlock', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people.owner.userId);
    const call = (await add(made.lead.id, { kind: 'call' })).body;
    // The lead's row is held until the hand-over and the done are both seen waiting, the hand-over
    // first: each locks the lead before the task, so neither holds what the other waits for.
    const held = await holdLock(sql`select id from lead where id = ${made.lead.id} for update`);
    const handing = assignOne(
      owner(),
      made.lead.id,
      here.people.rep.userId,
      here.people.owner.userId,
    );
    await held.waitForWaiters(1);
    const closing = owner().call<Task>('POST', `/tasks/${call.id}/done`, { capturedAt: now() });
    await held.waitForWaiters(2);
    await held.release();
    const [handed, closed] = await Promise.all([handing, closing]);
    expect([handed.status, closed.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(closed.body).toMatchObject({
      status: 'done',
      assignee: { userId: here.people.rep.userId },
    });
  });

  it('the surveyor closes the site visit they hold; another company sees no task', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await booked(owner(), made.lead.id, aVisit(here.people.surveyor.userId));
    const [visitTask] = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.kind === 'site_visit',
    );
    const id = visitTask?.id as string;
    const theirs = await world
      .as(elsewhere.members.owner)
      .call('POST', `/tasks/${id}/done`, { capturedAt: now() });
    expect(theirs.status).toBe(HttpStatus.NOT_FOUND);
    const gone = await owner().call('POST', `/tasks/${randomUUID()}/done`, { capturedAt: now() });
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
    const closed = await world
      .as(here.members.surveyor)
      .call<Task>('POST', `/tasks/${id}/done`, { capturedAt: now() });
    expect(closed.status).toBe(HttpStatus.OK);
    expect(closed.body.status).toBe('done');
  });
});
