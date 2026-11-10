import { task } from '@heliogrid/db';
import { FOUNDER_ROLE, type TaskKind, type TaskStatus } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aLeadBy, assignOne } from './assign-support';
import {
  aStaffedCompany,
  type Caller,
  type CrmWorld,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * The work on a lead follows its owner (`M02-27`, RFC decision 8): an assignment moves the lead's
 * open calls and follow-ups from whoever held them for it — the previous owner, or the person who
 * captured it while it had none — to the new owner, in the same transaction. A site visit stays
 * with its surveyor, a custom task and a closed one stay as they are, and a colleague's own
 * follow-up stays theirs.
 */

const here = aStaffedCompany('Assign Tasks EPC', {
  owner: [FOUNDER_ROLE],
  manager: [preset.sales_manager],
  rajesh: [preset.sales_executive],
  sunita: [preset.sales_executive],
  surveyor: [preset.survey_engineer],
});

const skip = skipWithoutDatabase(
  'ASSIGN TASKS PROOF',
  'Tasks following the owner are UNPROVEN on the wire in this run.',
);

type Person = keyof typeof here.people;

/** The tasks a lead holds before its assignment: whose, what, and in which state. */
const HELD: readonly { kind: TaskKind; status: TaskStatus; heldBy: Person | 'holder' }[] = [
  { kind: 'call', status: 'open', heldBy: 'holder' },
  { kind: 'follow_up', status: 'open', heldBy: 'holder' },
  { kind: 'site_visit', status: 'open', heldBy: 'surveyor' },
  { kind: 'custom', status: 'open', heldBy: 'holder' },
  { kind: 'call', status: 'done', heldBy: 'holder' },
  { kind: 'call', status: 'cancelled', heldBy: 'holder' },
  { kind: 'follow_up', status: 'open', heldBy: 'manager' },
];

describe.skipIf(skip)('tasks following the owner, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const person = (who: Person) => here.people[who].userId;

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  /** Raises each task of `HELD` on the lead, on the admin path; `holder` is whoever holds it now. */
  async function raiseHeld(leadId: string, holder: Person) {
    const raised = await world.pools.admin.db
      .insert(task)
      .values(
        HELD.map(({ kind, status, heldBy }) => ({
          tenantId: here.company.tenantId,
          leadId,
          assigneeUserId: person(heldBy === 'holder' ? holder : heldBy),
          kind,
          title: kind === 'custom' ? 'Send the roof photos' : null,
          dueAt: new Date(),
          status,
          provenance: 'manual' as const,
          createdAt: new Date(),
          createdBy: person('owner'),
          doneAt: status === 'done' ? new Date() : null,
        })),
      )
      .returning({ id: task.id });
    return raised.map((one) => one.id);
  }

  async function holdersOf(leadId: string) {
    const rows = await world.pools.admin.db
      .select({ id: task.id, assignee: task.assigneeUserId })
      .from(task)
      .where(eq(task.leadId, leadId));
    return new Map(rows.map((row) => [row.id, row.assignee]));
  }

  const single = (caller: Caller, leadId: string, from: Person | null, to: Person) =>
    assignOne(caller, leadId, person(to), from === null ? null : person(from), 'Covering a leave');
  const bulk = (caller: Caller, leadId: string, from: Person | null, to: Person) =>
    caller.call('POST', '/leads/assign', {
      leadIds: [leadId],
      assigneeId: person(to),
      ...(from === null ? {} : { reason: 'Covering a leave' }),
    });

  it.each([
    { act: 'an assign', send: single, from: null, holder: 'owner' },
    { act: 'a bulk assign', send: bulk, from: null, holder: 'owner' },
    { act: 'a reassign', send: single, from: 'rajesh', holder: 'rajesh' },
    { act: 'a bulk reassign', send: bulk, from: 'rajesh', holder: 'rajesh' },
  ] as const)(
    '$act moves the open calls and follow-ups their holder kept to the new owner, and no other task',
    async ({ send, from, holder }) => {
      const leadId = await aLeadBy(owner(), 'Tasks Follow');
      if (from !== null) await ownLead(world, leadId, person(from));
      const ids = await raiseHeld(leadId, holder);

      const reply = await send(owner(), leadId, from, 'sunita');
      expect(reply.status).toBe(HttpStatus.OK);
      const after = await holdersOf(leadId);
      const holderAfter = [
        'sunita',
        'sunita',
        'surveyor',
        holder,
        holder,
        holder,
        'manager',
      ] as const;
      expect(ids.map((id) => after.get(id))).toEqual(holderAfter.map(person));
    },
  );

  it('a lead with an owner keeps the capturer’s own tasks with the capturer', async () => {
    const leadId = await aLeadBy(owner(), 'Tasks Stay');
    await ownLead(world, leadId, person('rajesh'));
    const ids = await raiseHeld(leadId, 'owner');

    const reply = await single(owner(), leadId, 'rajesh', 'sunita');
    expect(reply.status).toBe(HttpStatus.OK);
    const after = await holdersOf(leadId);
    const holderAfter = [
      'owner',
      'owner',
      'surveyor',
      'owner',
      'owner',
      'owner',
      'manager',
    ] as const;
    expect(ids.map((id) => after.get(id))).toEqual(holderAfter.map(person));
  });
});
