import type { ProjectCard } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditEntriesOf } from '../crm/support';
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
  preset,
  type Refused,
  refusalOf,
  seededRowsOf,
  TO_COMMISSIONED,
  walk,
} from './support';

/**
 * A person's moves on the wire (`M08-14`, `M08-51`, rulings 2026-11-10): forward to the next stage
 * only, *Dispatched* with its crew, one stage back, undo of one's own last move, cancel with its
 * reason — and every refusal answered with domain's reason, the project left where it stood.
 */

const here = aStaffedCompany('Project Moves EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
  installer: [preset.installation_team_member],
  seller: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'PROJECT MOVES PROOF',
  'The project stage acts are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the project moves, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a forward tap moves to the next stage and names who moved it', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const moved = await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    expect(moved.stage).toBe('material_ordered');
    expect(moved.journey.at(-1)).toMatchObject({
      from: 'won',
      to: 'material_ordered',
      cause: 'person',
      movedBy: { userId: ownerId() },
    });
  });

  it('a tap straight to Dispatched is refused — it names its crew in its own sheet (ruling 6)', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    expect(refusalOf(await actOn(owner(), projectId, 'move', { to: 'dispatched' }))).toBe(
      'needs_crew',
    );
    expect((await detailOf(owner(), projectId)).body.stage).toBe('material_ordered');
  });

  it('a second Move back from the stage already left is refused, and the project steps back once (ruling 16)', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(
      owner(),
      projectId,
      ['material_ordered', 'dispatched'],
      [here.people.installer.userId],
    );
    await acted(owner(), projectId, 'move-back', { from: 'dispatched' });
    expect(refusalOf(await actOn(owner(), projectId, 'move-back', { from: 'dispatched' }))).toBe(
      'already_moved',
    );
    expect((await detailOf(owner(), projectId)).body.stage).toBe('material_ordered');
  });

  it('a tap that skips a stage is refused, and the project stays', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const reply = await actOn(owner(), projectId, 'move', { to: 'installation' });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect((reply.body as unknown as Refused).error).toMatchObject({
      code: 'PROJECT_ACT_REFUSED',
      facts: { refusal: 'not_next_stage' },
    });
    expect((await detailOf(owner(), projectId)).body.stage).toBe('won');
  });

  it.each([
    ['the stage it stands at', 'material_ordered'],
    ['a stage it passed', 'won'],
  ])('a tap to %s is told it already moved', async (_where, to) => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    expect(refusalOf(await actOn(owner(), projectId, 'move', { to }))).toBe('already_moved');
  });

  it('dispatch moves to Dispatched with its crew', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const dispatched = await acted(owner(), projectId, 'dispatch', {
      crew: [here.people.installer.userId],
      leftOn: dayFromToday(0),
    });
    expect(dispatched.stage).toBe('dispatched');
    expect(dispatched.crew).toEqual([
      expect.objectContaining({ userId: here.people.installer.userId }),
    ]);
  });

  it('dispatch with someone off the installation team is refused, and nothing moves', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const reply = await actOn(owner(), projectId, 'dispatch', {
      crew: [here.people.seller.userId],
      leftOn: dayFromToday(0),
    });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('not_on_crew');
    expect((await detailOf(owner(), projectId)).body).toMatchObject({
      stage: 'material_ordered',
      crew: [],
    });
  });

  it('move back goes one stage back, and Won has nothing behind it', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const back = await acted(owner(), projectId, 'move-back', { from: 'material_ordered' });
    expect(back.stage).toBe('won');
    expect(back.journey.at(-1)).toMatchObject({
      from: 'material_ordered',
      to: 'won',
      cause: 'person',
    });
    expect(refusalOf(await actOn(owner(), projectId, 'move-back', { from: 'won' }))).toBe(
      'nothing_behind',
    );
  });

  it('a person undoes their own last move; another person cannot undo it', async () => {
    const { projectId } = await aWonProject(owner(), here.people.pm.userId);
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const theirs = await actOn(world.as(here.members.pm), projectId, 'undo');
    expect(theirs.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(theirs)).toBe('not_undoable');
    const undone = await acted(owner(), projectId, 'undo');
    expect(undone.stage).toBe('won');
    expect(undone.journey.at(-1)).toMatchObject({
      from: 'material_ordered',
      to: 'won',
      cause: 'undo',
    });
    expect(refusalOf(await actOn(owner(), projectId, 'undo'))).toBe('not_undoable');
  });

  it('a new install date is today or later', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const change = (days: number) =>
      actOn(owner(), projectId, 'details', { expectedInstallOn: dayFromToday(days) });
    expect(refusalOf(await change(-1))).toBe('date_in_past');
    expect((await change(0)).body).toMatchObject({ expectedInstallOn: dayFromToday(0) });
  });

  it("cancel names one of its reasons; something else needs the person's words", async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const unknown = await actOn(owner(), projectId, 'cancel', { reason: 'bored', note: null });
    expect(unknown.status).toBe(HttpStatus.BAD_REQUEST);
    const unsaid = await actOn(owner(), projectId, 'cancel', {
      reason: 'something_else',
      note: null,
    });
    expect(refusalOf(unsaid)).toBe('reason_needed');
    const said = await acted(owner(), projectId, 'cancel', {
      reason: 'something_else',
      note: 'Roof sold with the house',
    });
    expect(said.cancel).toMatchObject({
      reason: 'something_else',
      note: 'Roof sold with the house',
    });
  });

  it('cancel takes its reason, closes the project, and every later act is refused', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const blank = await actOn(owner(), projectId, 'cancel', { reason: '   ', note: null });
    expect(blank.status).toBe(HttpStatus.BAD_REQUEST);
    const cancelled = await acted(owner(), projectId, 'cancel', {
      reason: 'customer_backed_out',
      note: null,
    });
    expect(cancelled).toMatchObject({
      stage: 'cancelled',
      cancel: { reason: 'customer_backed_out', note: null, by: { userId: ownerId() } },
      acts: { stages: false, documents: false, steps: false },
    });
    const audited = await auditEntriesOf(
      world,
      here.company.tenantId,
      'projects.project_cancelled',
    );
    expect(audited.filter((one) => one.subjectRef === projectId)).toMatchObject([
      { subjectKind: 'project', actorRef: ownerId() },
    ]);
    for (const [verb, body] of [
      ['move', { to: 'material_ordered' }],
      ['move-back', { from: 'cancelled' }],
      ['cancel', { reason: 'won_by_mistake', note: null }],
      ['steps/tick', { step: 'mounting_structure', doneBy: null }],
    ] as const) {
      expect(refusalOf(await actOn(owner(), projectId, verb, body))).toBe('project_closed');
    }
    const board = await boardOf(owner());
    expect(board.live.map((card) => card.id)).not.toContain(projectId);
    const closed = await owner().call<{ items: ProjectCard[] }>(
      'GET',
      '/projects/closed?stage=cancelled&page=1&limit=100',
    );
    expect(closed.body.items.map((card) => card.id)).toContain(projectId);
    const since = (days: number) =>
      owner().call<{ items: ProjectCard[] }>(
        'GET',
        `/projects/closed?stage=cancelled&since=${dayFromToday(days)}&page=1&limit=100`,
      );
    expect((await since(0)).body.items.map((card) => card.id)).toContain(projectId);
    expect((await since(1)).body.items.map((card) => card.id)).not.toContain(projectId);
  });

  it('handover is refused away from its stage, and while a row still waits', async () => {
    const { projectId } = await aWonProject(owner(), ownerId(), 'commercial');
    expect(refusalOf(await actOn(owner(), projectId, 'handover'))).toBe('not_next_stage');
    await walk(owner(), projectId, TO_COMMISSIONED, [here.people.installer.userId]);
    const reply = await actOn(owner(), projectId, 'handover');
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('documents_pending');
    const preview = await owner().call<{ pendingRows: string[] }>(
      'GET',
      `/projects/${projectId}/handover`,
    );
    // Every row waits but the handover pack, which the handover itself makes.
    expect(preview.body.pendingRows).toHaveLength(seededRowsOf('commercial') - 1);
    expect(preview.body.pendingRows).not.toContain('handover_pack');
  });

  it('a manager who is not a project manager or the owner is refused', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const reply = await actOn(owner(), projectId, 'details', {
      managerId: here.people.seller.userId,
    });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('not_a_manager');
  });
});
