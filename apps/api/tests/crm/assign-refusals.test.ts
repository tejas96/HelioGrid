import type { Assignees, LeadDetail } from '@heliogrid/contracts';
import { tenantMembership } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aLeadBy, assignOne, binnedBy, ownerOf, refusalOf, shapeLead } from './assign-support';
import { aStaffedCompany, type CrmWorld, openCrmWorld, preset } from './support';

/**
 * Who may assign, and to whom (`M02-28`, `F2.M02.assign-leads`): a Sales Executive is refused
 * every assign route; a deactivated member or one who cannot hold leads is never offered and never
 * given one; a closed lead takes no owner until it is reopened; an owner the screen never showed
 * opens no lead outside the scope. Each refusal moves nothing.
 */

const here = aStaffedCompany('Assign Doors EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rajesh: [preset.sales_executive],
  leaver: [preset.sales_executive],
  surveyor: [preset.survey_engineer],
});

const skip = skipWithoutDatabase(
  'ASSIGN REFUSALS PROOF',
  'Who may assign, and to whom, is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('assign refusals, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const person = (who: keyof typeof here.people) => here.people[who].userId;

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a deactivated member is never offered and cannot be given a lead', async () => {
    const listed = async () =>
      (await owner().call<Assignees>('GET', '/lead-assignees')).body.items.map((one) => one.userId);
    expect(await listed()).toContain(person('leaver'));
    expect(await listed()).not.toContain(person('surveyor'));
    await world.pools.admin.db
      .update(tenantMembership)
      .set({ status: 'deactivated' })
      .where(eq(tenantMembership.id, here.members.leaver.membershipId));
    expect(await listed()).not.toContain(person('leaver'));

    const leadId = await aLeadBy(owner(), 'Doors Lead');
    for (const who of ['leaver', 'surveyor'] as const) {
      const reply = await assignOne(owner(), leadId, person(who), null);
      expect({ who, status: reply.status, error: refusalOf(reply) }).toMatchObject({
        who,
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        error: { code: 'ASSIGNEE_UNAVAILABLE', details: [{ path: 'assigneeId' }] },
      });
    }
    expect(await ownerOf(world, leadId)).toBeNull();
  });

  it('a Sales Executive, who may not assign, is refused every assign route', async () => {
    const leadId = await aLeadBy(owner(), 'Doors Lead');
    const rajesh = world.as(here.members.rajesh);
    const routes = [
      ['GET', '/lead-assignees', undefined],
      ['POST', `/leads/${leadId}/assign`, { assigneeId: person('rajesh'), expectedOwnerId: null }],
      ['POST', '/leads/assign', { leadIds: [leadId], assigneeId: person('rajesh') }],
    ] as const;
    for (const [method, path, body] of routes) {
      const reply = await rajesh.call(method, path, body);
      expect({ path, status: reply.status }).toEqual({ path, status: HttpStatus.FORBIDDEN });
    }
    expect(await ownerOf(world, leadId)).toBeNull();
  });

  it('a closed lead is refused an owner until it is reopened', async () => {
    const leadId = await aLeadBy(owner(), 'Doors Lead');
    await shapeLead(world, leadId, binnedBy(person('owner')));
    const reply = await assignOne(owner(), leadId, person('rajesh'), null);
    expect({ status: reply.status, error: refusalOf(reply) }).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      error: { code: 'LEAD_TRANSITION_REFUSED', facts: { refusal: 'lead_closed' } },
    });
    expect(await ownerOf(world, leadId)).toBeNull();
  });

  it('an out-of-scope lead with a crafted expected owner answers 404 and shows nothing of it', async () => {
    const manager = world.as(here.members.manager);
    const leadId = await aLeadBy(owner(), 'Out Of Reach');
    expect((await assignOne(owner(), leadId, person('rajesh'), null)).status).toBe(HttpStatus.OK);
    // The manager never held it: naming themselves as the owner they saw opens nothing.
    const crafted = await assignOne(manager, leadId, person('rajesh'), person('manager'));
    expect({ status: crafted.status, lead: (crafted.body as Partial<LeadDetail>).lead }).toEqual({
      status: HttpStatus.NOT_FOUND,
      lead: undefined,
    });
    // Unassigned on their screen once, it answers only who holds it now — never the lead itself.
    const stale = await assignOne(manager, leadId, person('rajesh'), null);
    expect({ status: stale.status, error: refusalOf(stale) }).toMatchObject({
      status: HttpStatus.CONFLICT,
      error: { code: 'LEAD_ALREADY_ASSIGNED', facts: { owner: { userId: person('rajesh') } } },
    });
    expect((stale.body as Partial<LeadDetail>).lead).toBeUndefined();
    // Reassigned since, it is no longer the race their screen lost: it answers nothing of it.
    const back = await assignOne(owner(), leadId, person('owner'), person('rajesh'), 'Back home');
    expect(back.status).toBe(HttpStatus.OK);
    const reassigned = await assignOne(manager, leadId, person('rajesh'), null);
    expect({ status: reassigned.status, error: refusalOf(reassigned) }).toMatchObject({
      status: HttpStatus.NOT_FOUND,
      error: { code: 'NOT_FOUND' },
    });
    expect(refusalOf(reassigned).facts).toBeUndefined();
    // A lead they held and lost answers who holds it now, as their stale screen asks.
    const theirs = await aLeadBy(owner(), 'Once Theirs');
    await assignOne(owner(), theirs, person('manager'), null);
    await assignOne(owner(), theirs, person('rajesh'), person('manager'), 'Moved to Rajesh');
    const lost = await assignOne(manager, theirs, person('owner'), person('manager'));
    expect({ status: lost.status, error: refusalOf(lost) }).toMatchObject({
      status: HttpStatus.CONFLICT,
      error: { code: 'LEAD_ALREADY_ASSIGNED', facts: { owner: { userId: person('rajesh') } } },
    });
    expect([await ownerOf(world, leadId), await ownerOf(world, theirs)]).toEqual([
      person('owner'),
      person('rajesh'),
    ]);
  });
});
