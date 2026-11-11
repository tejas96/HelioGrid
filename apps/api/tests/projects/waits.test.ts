import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  actOn,
  aStaffedCompany,
  aWonProject,
  boardOf,
  dayFromToday,
  detailOf,
  openProjectsWorld,
  type ProjectsWorld,
  refusalOf,
} from './support';

/**
 * Waits on the wire (`M08-20`…`M08-22`, rulings 2026-11-10): who the project waits on, why and
 * since when — one open at a time, a reason of its party, never a day ahead — ended by a person or
 * closed by a forward move, and never moving the stage itself.
 */

const here = aStaffedCompany('Project Waits EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROJECT WAITS PROOF',
  'The project waits are UNPROVEN on the wire in this run.',
);

const aWait = (typed: Record<string, unknown> = {}) => ({
  party: 'customer',
  reason: 'site_access',
  startedOn: dayFromToday(0),
  note: 'Gate locked on both visits',
  ...typed,
});

describe.skipIf(skip)('the project waits, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a wait started today shows on the project and its card, and moves no stage', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const waiting = await acted(owner(), projectId, 'wait', aWait());
    expect(waiting.stage).toBe('won');
    expect(waiting.wait).toMatchObject({
      party: 'customer',
      reason: 'site_access',
      startedOn: dayFromToday(0),
      note: 'Gate locked on both visits',
      openedBy: { userId: ownerId() },
    });
    const card = (await boardOf(owner())).live.find((one) => one.id === projectId);
    expect(card?.wait).toEqual({
      party: 'customer',
      reason: 'site_access',
      startedOn: dayFromToday(0),
    });
  });

  it('a rejected subsidy claim is a wait on DISCOM naming the rejection and why, and the stage holds (M08-27)', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const rejected = await acted(
      owner(),
      projectId,
      'wait',
      aWait({
        party: 'utility',
        reason: 'incentive_rejected',
        note: 'Name on the bank account differs',
      }),
    );
    expect(rejected.stage).toBe('won');
    expect(rejected.wait).toMatchObject({
      party: 'utility',
      reason: 'incentive_rejected',
      note: 'Name on the bank account differs',
    });
  });

  it("each act lands on the lead's one timeline with who did it, newest first, nothing editable (M08-17)", async () => {
    const { projectId, leadId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    await acted(owner(), projectId, 'wait', aWait());
    const reply = await owner().call<{ items: { kind: string; actor: unknown }[] }>(
      'GET',
      `/leads/${leadId}/activities?page=1&limit=50`,
    );
    const project = reply.body.items.filter((item) => item.kind.startsWith('project_'));
    expect(project.map((item) => item.kind)).toEqual([
      'project_wait',
      'project_moved',
      'project_moved',
    ]);
    expect(project.every((item) => item.actor !== null)).toBe(true);
  });

  it('a wait that started yesterday is taken', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const waiting = await acted(owner(), projectId, 'wait', aWait({ startedOn: dayFromToday(-1) }));
    expect(waiting.wait?.startedOn).toBe(dayFromToday(-1));
  });

  it('a second wait while one is open is refused', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'wait', aWait());
    const again = await actOn(
      owner(),
      projectId,
      'wait',
      aWait({ party: 'material', reason: 'material_supply' }),
    );
    expect(again.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(again)).toBe('wait_open');
  });

  it.each([
    [
      'a reason of another party',
      { party: 'utility', reason: 'site_access' },
      'reason_not_of_party',
    ],
    ['a start tomorrow', { startedOn: dayFromToday(1) }, 'date_in_future'],
  ])('%s is refused and no wait opens', async (_case, typed, refusal) => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const reply = await actOn(owner(), projectId, 'wait', aWait(typed));
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe(refusal);
    expect((await detailOf(owner(), projectId)).body.wait).toBeNull();
  });

  it('ending the wait clears it, and a second end finds none open', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'wait', aWait());
    const ended = await acted(owner(), projectId, 'wait/end');
    expect(ended.wait).toBeNull();
    const card = (await boardOf(owner())).live.find((one) => one.id === projectId);
    expect(card?.wait).toBeNull();
    expect(refusalOf(await actOn(owner(), projectId, 'wait/end'))).toBe('no_open_wait');
  });

  it('a forward move closes the open wait by itself', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'wait', aWait());
    const moved = await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    expect(moved.stage).toBe('material_ordered');
    expect(moved.wait).toBeNull();
  });

  it('undoing the move that closed a wait opens that wait again, as it was', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'wait', aWait());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const undone = await acted(owner(), projectId, 'undo');
    expect(undone.stage).toBe('won');
    expect(undone.wait).toMatchObject({
      party: 'customer',
      reason: 'site_access',
      startedOn: dayFromToday(0),
      note: 'Gate locked on both visits',
    });
  });

  it('undoing a move after a new wait opened keeps the new wait; the closed one stays closed', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'wait', aWait());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    await acted(
      owner(),
      projectId,
      'wait',
      aWait({ party: 'company', reason: 'crew_availability' }),
    );
    const undone = await acted(owner(), projectId, 'undo');
    expect(undone.stage).toBe('won');
    expect(undone.wait).toMatchObject({ party: 'company', reason: 'crew_availability' });
  });

  it('a move back leaves the open wait standing', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    await acted(owner(), projectId, 'wait', aWait());
    const back = await acted(owner(), projectId, 'move-back', { from: 'material_ordered' });
    expect(back.stage).toBe('won');
    expect(back.wait).toMatchObject({ party: 'customer', reason: 'site_access' });
  });
});
