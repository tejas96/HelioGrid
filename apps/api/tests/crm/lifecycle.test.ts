import type { LeadDetail } from '@heliogrid/contracts';
import { leadStageTransition } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { dayFromToday } from './lead-work';
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
 * The lead's R9 acts on the wire (`M02-45`, `M02-49`…`M02-56`, T-M02-015): each move is domain's
 * decision on the locked lead, written once to the lead, its funnel history and its timeline; a
 * move the lead's standing does not allow is refused with domain's reason and changes nothing.
 */

const here = aStaffedCompany('Lifecycle EPC', {
  owner: [FOUNDER_ROLE],
  surveyor: [preset.survey_engineer],
});

const skip = skipWithoutDatabase(
  'LIFECYCLE PROOF',
  'The lead lifecycle acts are UNPROVEN on the wire in this run.',
);

const now = () => new Date().toISOString();

interface Refused {
  readonly error: { readonly code: string; readonly facts: { readonly refusal: string } };
}

describe.skipIf(skip)('the lead lifecycle acts, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const act = (leadId: string, verb: string, body: Record<string, unknown> = {}) =>
    owner().call<LeadDetail>('POST', `/leads/${leadId}/${verb}`, { capturedAt: now(), ...body });
  const movesOf = (leadId: string) =>
    world.pools.admin.db
      .select()
      .from(leadStageTransition)
      .where(eq(leadStageTransition.leadId, leadId))
      .orderBy(asc(leadStageTransition.movedAt), asc(leadStageTransition.id));

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a reopen writes one transition and one timeline entry and counts', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    expect((await act(made.lead.id, 'junk')).body.lead.state).toBe('junk');
    const before = (await entriesOfKind(world, made.lead.id, 'state_change')).length;
    const reopened = await act(made.lead.id, 'reopen');
    expect(reopened.status).toBe(HttpStatus.OK);
    expect(reopened.body.lead).toMatchObject({ state: null, stage: 'new' });
    expect(reopened.body.lifecycle.reopenCount).toBe(1);
    // The close stays on the record through the reopen (`M02-56`).
    expect(reopened.body.lifecycle.lastClose).toMatchObject({ state: 'junk' });
    const moves = await movesOf(made.lead.id);
    expect(moves.map((move) => [move.fromState, move.toState, move.cause])).toEqual([
      [null, 'junk', 'manual'],
      ['junk', null, 'reopen'],
    ]);
    const entries = await entriesOfKind(world, made.lead.id, 'state_change');
    expect(entries).toHaveLength(before + 1);
    expect(entries.at(-1)?.body).toMatchObject({ from: 'junk', to: null, cause: 'reopen' });
  });

  it('a snooze without a wake date is refused before anything moves', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const reply = await act(made.lead.id, 'snooze');
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await movesOf(made.lead.id)).length).toBe(0);
  });

  it.each([
    ['today', 0],
    ['yesterday', -1],
  ])('a snooze to %s is refused with its reason, and the lead stays active', async (_day, days) => {
    const made = await captured(owner(), aCapture(aPhone()));
    const reply = await act(made.lead.id, 'snooze', { wakeOn: dayFromToday(days) });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect((reply.body as unknown as Refused).error).toMatchObject({
      code: 'LEAD_TRANSITION_REFUSED',
      facts: { refusal: 'wake_date_not_future' },
    });
    expect((await movesOf(made.lead.id)).length).toBe(0);
  });

  it('a snooze to tomorrow parks the lead at its stage, and waking it now returns it', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const snoozed = await act(made.lead.id, 'snooze', { wakeOn: dayFromToday(1) });
    expect(snoozed.body.lead).toMatchObject({ state: 'snoozed', stage: 'new' });
    expect(snoozed.body.lifecycle.wakeOn).toBe(dayFromToday(1));
    const woken = await act(made.lead.id, 'wake');
    expect(woken.body.lead).toMatchObject({ state: null, stage: 'new' });
    const again = await act(made.lead.id, 'wake');
    expect((again.body as unknown as Refused).error.facts.refusal).toBe('not_snoozed');
  });

  it('mark qualified moves the stage once, and a second press is refused', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const qualified = await act(made.lead.id, 'qualified');
    expect(qualified.body.lead.stage).toBe('qualified');
    expect(qualified.body.qualifiedAt).not.toBeNull();
    const again = await act(made.lead.id, 'qualified');
    expect(again.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect((again.body as unknown as Refused).error.facts.refusal).toBe('stage_reached');
  });

  it('a closed lead takes no second close, and a preset without state changes cannot act', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people.owner.userId);
    const out = await act(made.lead.id, 'disqualify', { reason: 'not_interested' });
    expect(out.body.lead.state).toBe('disqualified');
    const junked = await act(made.lead.id, 'junk');
    expect((junked.body as unknown as Refused).error.facts.refusal).toBe('lead_closed');
    const surveyor = world.as(here.members.surveyor);
    const reply = await surveyor.call('POST', `/leads/${made.lead.id}/reopen`, {
      capturedAt: now(),
    });
    expect(reply.status).toBe(HttpStatus.FORBIDDEN);
  });
});
