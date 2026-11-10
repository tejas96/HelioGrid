import { randomUUID } from 'node:crypto';
import { activity } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aVisit, booked, tasksOf, visitsOf } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  openCrmWorld,
  preset,
  retryKey,
} from './support';

/**
 * Work on a lead sent twice is ONE write (`F4-07`): a call, a note, a message, a task and a visit
 * each carry their create's retry key — the timeline's entries on their own column — so a retry
 * on a slow network finds the first and writes nothing more, and a key reused for another request
 * is refused with nothing written.
 */

const here = aStaffedCompany('Retried Work EPC', {
  owner: [FOUNDER_ROLE],
  surveyor: [preset.survey_engineer],
});

const skip = skipWithoutDatabase(
  'RETRIED LEAD WORK PROOF',
  'A retried call, note, task, visit or message is UNPROVEN on the wire in this run.',
);

const now = () => new Date().toISOString();
const A_SECOND_MS = 1_000;
const AN_HOUR_MS = 3_600_000;

describe.skipIf(skip)('work on a lead sent twice, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const entriesWithKey = (key: string) =>
    world.pools.admin.db.select().from(activity).where(eq(activity.creationKey, key));

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it.each([
    ['a call', 'calls', { outcome: 'answered' }],
    ['a note', 'notes', { text: 'Wants a quote by Friday' }],
    ['a message', 'messages', { templateKey: 'follow_up_nudge' }],
  ])('%s sent twice with one key writes one timeline entry', async (_what, path, sent) => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Twice Sent' }));
    const key = randomUUID();
    const body = { capturedAt: now(), ...sent };
    const first = await owner().call('POST', `/leads/${made.lead.id}/${path}`, body, retryKey(key));
    const second = await owner().call(
      'POST',
      `/leads/${made.lead.id}/${path}`,
      body,
      retryKey(key),
    );
    expect([first.status, second.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(second.body).toEqual(first.body);
    expect(await entriesWithKey(key)).toHaveLength(1);
    const other = await owner().call(
      'POST',
      `/leads/${made.lead.id}/${path}`,
      { ...body, capturedAt: new Date(Date.now() + A_SECOND_MS).toISOString() },
      retryKey(key),
    );
    expect(other.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(other.body).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
    expect(await entriesWithKey(key)).toHaveLength(1);
  });

  it('a task and a visit sent twice with one key are each written once', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const taskKey = retryKey();
    const aTask = { kind: 'call', dueAt: new Date(Date.now() + AN_HOUR_MS).toISOString() };
    const first = await owner().call('POST', `/leads/${made.lead.id}/tasks`, aTask, taskKey);
    const second = await owner().call('POST', `/leads/${made.lead.id}/tasks`, aTask, taskKey);
    expect(second.body).toEqual(first.body);
    const manual = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.provenance === 'manual',
    );
    expect(manual).toHaveLength(1);

    const visitKey = retryKey();
    const visit = aVisit(here.people.surveyor.userId);
    const booking = await owner().call('POST', `/leads/${made.lead.id}/visits`, visit, visitKey);
    const retried = await owner().call('POST', `/leads/${made.lead.id}/visits`, visit, visitKey);
    expect([booking.status, retried.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(await visitsOf(world, made.lead.id)).toHaveLength(1);
  });

  it('a visit booked and then booked again without the key is a conflict, not a second visit', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await booked(owner(), made.lead.id, aVisit(here.people.surveyor.userId));
    const again = await owner().call(
      'POST',
      `/leads/${made.lead.id}/visits`,
      aVisit(here.people.surveyor.userId),
      retryKey(),
    );
    expect(again.status).toBe(HttpStatus.CONFLICT);
    expect(await visitsOf(world, made.lead.id)).toHaveLength(1);
  });
});
