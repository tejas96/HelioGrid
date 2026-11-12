import type { LeadDetail } from '@heliogrid/contracts';
import { lead, subscription } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY, noCallUntilOf } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aTrial } from '../billing/support';
import { skipWithoutDatabase } from '../support/fixture';
import { dayFromToday, onTheClock, sweepAt, tasksOf } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  auditEntriesOf,
  type Caller,
  type CrmWorld,
  captured,
  openCrmWorld,
  ownLead,
  preset,
  retryKey,
} from './support';

/**
 * Mark lost on the wire (`M07-63`, `M02-54`): one of the seven reasons closes the lead, its open
 * tasks are cancelled and the close is audited (`F2-22`); a postponed loss needs a day ahead and
 * comes back on it; a won deal, a preset without the close grant, another company's lead and a
 * halted company are refused.
 */

const here = aStaffedCompany('Mark Lost EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
  surveyor: [preset.survey_engineer],
});
const elsewhere = aStaffedCompany('Other Mark Lost EPC', { owner: [FOUNDER_ROLE] });
const halted = aStaffedCompany('Halted Mark Lost EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'MARK LOST PROOF',
  'Mark lost is UNPROVEN on the wire in this run.',
);

/** How long ago the halted company's paid period ended. */
const PERIOD_DAYS = 5;

interface Refused {
  readonly error: { readonly code: string; readonly facts: { readonly refusal: string } };
}

const now = () => new Date().toISOString();

describe.skipIf(skip)('Mark lost, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const lose = (caller: Caller, leadId: string, body: Record<string, unknown>) =>
    caller.call<LeadDetail>('POST', `/leads/${leadId}/lost`, { capturedAt: now(), ...body });
  const refusalOf = (body: unknown) => (body as Refused).error;

  beforeAll(async () => {
    world = await openCrmWorld([here, elsewhere, halted]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a loss cancels the lead’s open tasks and is audited', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people.rep.userId);
    for (const kind of ['call', 'follow_up']) {
      const reply = await owner().call(
        'POST',
        `/leads/${made.lead.id}/tasks`,
        { kind, dueAt: new Date(Date.now() + MS_PER_DAY).toISOString() },
        retryKey(),
      );
      expect(reply.status).toBe(HttpStatus.CREATED);
    }
    const lost = await lose(world.as(here.members.rep), made.lead.id, { reason: 'price' });
    expect(lost.status).toBe(HttpStatus.OK);
    expect(lost.body.lead.state).toBe('lost');
    expect(lost.body.lifecycle.lastClose).toMatchObject({ state: 'lost', lostReason: 'price' });
    // A capture outside the calling window has its own call-back too: every open task goes.
    const statuses = (await tasksOf(world, made.lead.id)).map((one) => one.status);
    expect(statuses.length).toBeGreaterThanOrEqual(2);
    expect(new Set(statuses)).toEqual(new Set(['cancelled']));
    const entries = await auditEntriesOf(world, here.company.tenantId, 'crm.lead_lost');
    expect(entries.filter((one) => one.subjectRef === made.lead.id)).toMatchObject([
      { subjectKind: 'lead', actorRef: here.people.rep.userId, blocked: false },
    ]);
  });

  it('not interested holds calls back for six months', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const lost = await lose(owner(), made.lead.id, { reason: 'not_interested' });
    expect(lost.body.lifecycle.noCallUntil).toBe(noCallUntilOf(dayFromToday(0)));
  });

  it.each([
    ['no date', {}],
    ['today', { resurfaceOn: dayFromToday(0) }],
  ])('a postponed loss with %s is refused, and the lead stays open', async (_case, day) => {
    const made = await captured(owner(), aCapture(aPhone()));
    const reply = await lose(owner(), made.lead.id, { reason: 'postponed', ...day });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply.body)).toMatchObject({
      code: 'LEAD_TRANSITION_REFUSED',
      facts: { refusal: 'resurface_date_not_future' },
    });
    const [still] = await world.pools.admin.db
      .select({ state: lead.lifecycleState })
      .from(lead)
      .where(eq(lead.id, made.lead.id));
    expect(still?.state).toBeNull();
  });

  it('a loss postponed to a day ahead comes back that morning with a follow-up', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people.rep.userId);
    const resurfaceOn = dayFromToday(2);
    const lost = await lose(owner(), made.lead.id, { reason: 'postponed', resurfaceOn });
    expect(lost.body.lifecycle.resurfaceOn).toBe(resurfaceOn);
    expect(await sweepAt(world, here.company.tenantId, onTheClock(resurfaceOn, '09:30'))).toBe(
      true,
    );
    const back = await owner().call<LeadDetail>('GET', `/leads/${made.lead.id}`);
    expect(back.body.lead.state).toBeNull();
    const followUps = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.provenance === 'resurface',
    );
    expect(followUps).toMatchObject([{ kind: 'follow_up', status: 'open' }]);
  });

  it('a won deal is not lost here — its cancellation is the project’s', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await world.pools.admin.db.update(lead).set({ stage: 'won' }).where(eq(lead.id, made.lead.id));
    const reply = await lose(owner(), made.lead.id, { reason: 'price' });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply.body).facts.refusal).toBe('not_open');
  });

  it('a preset without the close grant is refused; another company’s lead is not found', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const surveyor = await lose(world.as(here.members.surveyor), made.lead.id, { reason: 'price' });
    expect(surveyor.status).toBe(HttpStatus.FORBIDDEN);
    const theirs = await lose(world.as(elsewhere.members.owner), made.lead.id, { reason: 'price' });
    expect(theirs.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a halted company cannot mark a lead lost, and still reads it', async () => {
    const theirs = world.as(halted.members.owner);
    const made = await captured(theirs, aCapture(aPhone()));
    const tenantId = halted.company.tenantId;
    await aTrial(world.pools.admin.db, tenantId, Date.now());
    await world.pools.admin.db
      .update(subscription)
      .set({
        state: 'halted',
        stateEnteredAt: new Date(Date.now() - MS_PER_DAY),
        paidPeriodEnd: new Date(Date.now() - PERIOD_DAYS * MS_PER_DAY),
      })
      .where(eq(subscription.tenantId, tenantId));
    const paused = await lose(theirs, made.lead.id, { reason: 'price' });
    expect(paused.status).toBe(HttpStatus.FORBIDDEN);
    const read = await theirs.call<LeadDetail>('GET', `/leads/${made.lead.id}`);
    expect(read.body.lead.state).toBeNull();
  });
});
