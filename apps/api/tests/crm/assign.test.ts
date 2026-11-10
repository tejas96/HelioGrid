import type { Assignees, BulkAssigned, LeadDetail } from '@heliogrid/contracts';
import { task } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY, type TaskStatus } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import {
  aLeadBy,
  assignOne,
  binnedBy,
  ownerOf,
  refusalOf,
  shapeLead,
  trailOf,
} from './assign-support';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  entriesOfKind,
  MINUTE_MS,
  noticesOf,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * Assignment (`M02-27`…`M02-31`, `M02-67`): the picker lists who can hold a lead with their open
 * and overdue counts; one tap assigns, compare-and-set on the owner the screen showed, so the loser
 * of a race learns who won; a selection goes to one person with each lead's result; every
 * assignment appends who, to whom, when and the open count, and tells the new owner once.
 */

const here = aStaffedCompany('Assign EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rajesh: [preset.sales_executive],
  sunita: [preset.sales_executive],
  meera: [preset.sales_executive],
  kiran: [preset.sales_executive],
});
const counted = aStaffedCompany('Assign Load EPC', {
  owner: [FOUNDER_ROLE],
  anita: [preset.sales_executive],
  vikram: [preset.sales_manager],
  surveyor: [preset.survey_engineer],
});
const elsewhere = aStaffedCompany('Other Assign EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'ASSIGN PROOF',
  'Lead assignment is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('lead assignment, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const manager = () => world.as(here.members.manager);
  const person = (who: keyof typeof here.people) => here.people[who].userId;
  const aLead = (name = 'Assign Lead') => aLeadBy(owner(), name);

  beforeAll(async () => {
    world = await openCrmWorld([here, counted, elsewhere]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the assignee list gives each active member their open and overdue counts', async () => {
    const boss = world.as(counted.members.owner);
    const { anita, vikram } = counted.people;
    const now = Date.now();
    const anitaLeads = [
      { stage: 'new' },
      { stage: 'contacted' },
      { lifecycleState: 'snoozed', snoozeWakeOn: '2099-01-01' },
      { stage: 'won' },
      binnedBy(counted.people.owner.userId),
    ] as const;
    for (const shape of anitaLeads) {
      const leadId = await aLeadBy(boss, 'Counted Lead');
      await shapeLead(world, leadId, { ownerUserId: anita.userId, ...shape });
    }
    const vikramLead = await aLeadBy(boss, 'Counted Lead');
    await shapeLead(world, vikramLead, { ownerUserId: vikram.userId, stage: 'qualified' });
    const anitaTasks: readonly [TaskStatus, number][] = [
      ['open', now - MS_PER_DAY],
      ['open', now - MINUTE_MS],
      ['open', now + MS_PER_DAY],
      ['done', now - MS_PER_DAY],
      ['cancelled', now - MS_PER_DAY],
    ];
    await world.pools.admin.db.insert(task).values(
      anitaTasks.map(([status, due]) => ({
        tenantId: counted.company.tenantId,
        leadId: vikramLead,
        assigneeUserId: anita.userId,
        kind: 'call' as const,
        dueAt: new Date(due),
        status,
        provenance: 'manual' as const,
        createdAt: new Date(now - MS_PER_DAY),
        createdBy: counted.people.owner.userId,
        doneAt: status === 'done' ? new Date(now) : null,
      })),
    );

    const listed = await boss.call<Assignees>('GET', '/lead-assignees');
    expect(listed.status).toBe(HttpStatus.OK);
    expect(listed.body.items).toEqual([
      { userId: anita.userId, name: anita.name, openCount: 2, overdueCount: 2 },
      { userId: counted.people.owner.userId, name: 'owner', openCount: 0, overdueCount: 0 },
      { userId: vikram.userId, name: vikram.name, openCount: 1, overdueCount: 0 },
    ]);
  });

  it('one target assigns every lead of a selection and reports each result', async () => {
    const [first, second, alreadyHers, junked] = [
      await aLead('Bulk One'),
      await aLead('Bulk Two'),
      await aLead('Bulk Three'),
      await aLead('Bulk Four'),
    ];
    await ownLead(world, alreadyHers, person('sunita'));
    await shapeLead(world, junked, binnedBy(person('owner')));
    const theirs = (await captured(world.as(elsewhere.members.owner), aCapture(aPhone()))).lead.id;
    const unknown = '0190c0de-0000-7000-8000-000000000000';

    const reply = await owner().call<BulkAssigned>('POST', '/leads/assign', {
      leadIds: [first, second, alreadyHers, junked, theirs, unknown, first],
      assigneeId: person('sunita'),
    });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.results).toEqual([
      { leadId: first, outcome: 'assigned' },
      { leadId: second, outcome: 'assigned' },
      { leadId: alreadyHers, outcome: 'unchanged' },
      { leadId: junked, outcome: 'unavailable' },
      { leadId: theirs, outcome: 'unavailable' },
      { leadId: unknown, outcome: 'unavailable' },
    ]);
    expect([await ownerOf(world, first), await ownerOf(world, second)]).toEqual([
      person('sunita'),
      person('sunita'),
    ]);
    expect([await ownerOf(world, junked), await ownerOf(world, theirs)]).toEqual([null, null]);
    // One notice for the batch, counting it (`F6-12`), opening the first lead given.
    const toSunita = await noticesOf(world, person('sunita'), first);
    expect(toSunita).toMatchObject([{ type: 'lead_assigned', title: '2 leads assigned to you' }]);
    expect(await noticesOf(world, person('sunita'), second)).toHaveLength(0);

    // Sent from the inbox, with no reason: a lead someone took meanwhile names its owner and stays.
    const waiting = await aLead('Bulk Five');
    const unexplained = await owner().call<BulkAssigned>('POST', '/leads/assign', {
      leadIds: [first, waiting],
      assigneeId: person('rajesh'),
    });
    expect(unexplained.body.results).toEqual([
      {
        leadId: first,
        outcome: 'already_assigned',
        owner: { userId: person('sunita'), name: 'sunita' },
      },
      { leadId: waiting, outcome: 'assigned' },
    ]);
    expect([await ownerOf(world, first), await ownerOf(world, waiting)]).toEqual([
      person('sunita'),
      person('rajesh'),
    ]);

    const explained = await owner().call<BulkAssigned>('POST', '/leads/assign', {
      leadIds: [first],
      assigneeId: person('rajesh'),
      reason: 'Sunita is on leave',
    });
    expect(explained.body.results).toEqual([{ leadId: first, outcome: 'assigned' }]);
    expect((await trailOf(world, first)).map((row) => [row.assignedTo, row.reason])).toEqual([
      [person('sunita'), null],
      [person('rajesh'), 'Sunita is on leave'],
    ]);
    const [toRajesh] = await noticesOf(world, person('rajesh'), first);
    expect(toRajesh?.title).toBe('Lead assigned to you: Bulk One');
  });

  it('an assign that loses the race answers LEAD_ALREADY_ASSIGNED naming the owner', async () => {
    const leadId = await aLead();
    const won = await assignOne(owner(), leadId, person('rajesh'), null);
    expect(won.status).toBe(HttpStatus.OK);
    // The manager's screen still shows it unassigned; their scope no longer reaches Rajesh's lead.
    const lost = await assignOne(manager(), leadId, person('sunita'), null);
    expect({ status: lost.status, error: refusalOf(lost) }).toMatchObject({
      status: HttpStatus.CONFLICT,
      error: {
        code: 'LEAD_ALREADY_ASSIGNED',
        facts: { owner: { userId: person('rajesh'), name: 'rajesh' } },
      },
    });
    // Naming an owner they never could see opens nothing.
    const blind = await assignOne(manager(), leadId, person('sunita'), person('kiran'));
    expect(blind.status).toBe(HttpStatus.NOT_FOUND);
    // The first tap retried lands where it did, and writes nothing again.
    const retried = await assignOne(owner(), leadId, person('rajesh'), null);
    expect(retried.status).toBe(HttpStatus.OK);
    expect(await ownerOf(world, leadId)).toBe(person('rajesh'));
    expect(await trailOf(world, leadId)).toHaveLength(1);
  });

  it('of two people assigning one lead at once, the second sees it already assigned', async () => {
    const leadId = await aLead();
    const held = await holdLock(sql`select 1 from lead where id = ${leadId} for update`);
    const taps = [
      assignOne(owner(), leadId, person('rajesh'), null),
      assignOne(manager(), leadId, person('sunita'), null),
    ];
    await held.waitForWaiters(taps.length);
    await held.release();
    const replies = await Promise.all(taps);
    expect(replies.map((one) => one.status).sort()).toEqual([HttpStatus.OK, HttpStatus.CONFLICT]);
    const byStatus = new Map(replies.map((one) => [one.status, one]));
    const won = byStatus.get(HttpStatus.OK);
    const lost = byStatus.get(HttpStatus.CONFLICT);
    if (won === undefined || lost === undefined) throw new Error('one tap wins and one loses');
    const winner = (won.body as LeadDetail).lead.owner;
    expect(refusalOf(lost)).toMatchObject({
      code: 'LEAD_ALREADY_ASSIGNED',
      facts: { owner: winner },
    });
    expect(await ownerOf(world, leadId)).toBe(winner?.userId);
    expect(await trailOf(world, leadId)).toHaveLength(1);
  });

  it('each assignment appends who, to whom, when and the open count, and notifies the new owner', async () => {
    for (const shape of [{}, { stage: 'contacted' }, binnedBy(person('owner'))] as const) {
      await shapeLead(world, await aLead('Meera Lead'), { ownerUserId: person('meera'), ...shape });
    }
    const leadId = await aLead('Priya Sharma');
    const before = Date.now();

    const first = await assignOne(owner(), leadId, person('meera'), null);
    expect(first).toMatchObject({
      status: HttpStatus.OK,
      body: { lead: { owner: { userId: person('meera') }, stage: 'new' } },
    });
    const [entry] = await trailOf(world, leadId);
    expect(entry).toMatchObject({
      assignedBy: person('owner'),
      assignedTo: person('meera'),
      openCountSnapshot: 2,
      reason: null,
    });
    expect(entry?.assignedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(await noticesOf(world, person('meera'), leadId)).toMatchObject([
      {
        type: 'lead_assigned',
        subjectKind: 'lead',
        title: 'Lead assigned to you: Priya Sharma',
        body: 'owner assigned it to you.',
      },
    ]);

    await shapeLead(world, leadId, { stage: 'contacted' });
    const leave = 'Meera is on leave';
    const moved = await assignOne(owner(), leadId, person('kiran'), person('meera'), leave);
    expect(moved).toMatchObject({
      status: HttpStatus.OK,
      body: { lead: { owner: { userId: person('kiran') }, stage: 'contacted' } },
    });
    expect(
      (await trailOf(world, leadId)).map((row) => [
        row.assignedTo,
        row.openCountSnapshot,
        row.reason,
      ]),
    ).toEqual([
      [person('meera'), 2, null],
      [person('kiran'), 0, leave],
    ]);
    const meera = { userId: person('meera'), name: 'meera' };
    const kiran = { userId: person('kiran'), name: 'kiran' };
    expect((await entriesOfKind(world, leadId, 'assignment')).map((one) => one.body)).toEqual([
      { from: null, to: meera, openCount: 2, reason: null },
      { from: meera, to: kiran, openCount: 0, reason: leave },
    ]);
    expect(await noticesOf(world, person('kiran'), leadId)).toHaveLength(1);
  });
});
