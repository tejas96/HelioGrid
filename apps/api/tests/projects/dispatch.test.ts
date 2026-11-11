import { project, projectStageTransition } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  actOn,
  aStaffedCompany,
  aWonProject,
  dayFromToday,
  detailOf,
  openProjectsWorld,
  type ProjectsWorld,
  preset,
  refusalOf,
  walk,
} from './support';

/**
 * *Dispatched* on the wire (the picked design, ruling 6): the day the material left the warehouse
 * — never ahead, never before Material ordered — counts the stage's days, and a crew is on a job
 * only while the project stands from Dispatched to the end of the electrical work.
 */

const here = aStaffedCompany('Project Dispatch EPC', {
  owner: [FOUNDER_ROLE],
  installer: [preset.installation_team_member],
});

const skip = skipWithoutDatabase(
  'PROJECT DISPATCH',
  'The dispatch day and the crew on site are UNPROVEN on the wire in this run.',
);

/** A day, for setting a stage's start back in the database. */
const DAY_MS = 86_400_000;

describe.skipIf(skip)('dispatch, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('dispatch takes the day the material left: never ahead, never before Material ordered', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const crew = [here.people.installer.userId];
    const ahead = await actOn(owner(), projectId, 'dispatch', { crew, leftOn: dayFromToday(1) });
    expect(refusalOf(ahead)).toBe('date_in_future');
    const before = await actOn(owner(), projectId, 'dispatch', { crew, leftOn: dayFromToday(-1) });
    expect(refusalOf(before)).toBe('date_before_stage');
    expect((await detailOf(owner(), projectId)).body.stage).toBe('material_ordered');
  });
  it('a dispatch on an earlier day counts the stage from that day, and the journey shows it', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const yesterday = dayFromToday(-1);
    await world.pools.admin.db
      .update(project)
      .set({ stageEnteredAt: new Date(Date.now() - 2 * DAY_MS) })
      .where(eq(project.id, projectId));
    const dispatched = await acted(owner(), projectId, 'dispatch', {
      crew: [here.people.installer.userId],
      leftOn: yesterday,
    });
    expect(dispatched).toMatchObject({ stage: 'dispatched', enteredOn: yesterday });
    expect(dispatched.journey.at(-1)).toMatchObject({ to: 'dispatched', enteredOn: yesterday });
  });
  it("the installer's job under way comes first — today's job — before one only dispatched", async () => {
    const installer = here.people.installer.userId;
    const waiting = await aWonProject(owner(), ownerId());
    await walk(owner(), waiting.projectId, ['material_ordered', 'dispatched'], [installer]);
    const begun = await aWonProject(owner(), ownerId());
    await walk(owner(), begun.projectId, ['material_ordered', 'dispatched'], [installer]);
    await acted(owner(), begun.projectId, 'steps/tick', {
      step: 'mounting_structure',
      doneBy: null,
    });
    const jobs = await world
      .as(here.members.installer)
      .call<{ id: string; stage: string }[]>('GET', '/projects/jobs');
    const ids = jobs.body.map((job) => job.id);
    expect(ids.indexOf(begun.projectId)).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf(begun.projectId)).toBeLessThan(ids.indexOf(waiting.projectId));
  });

  it('a crew moved back before Dispatched has no live project and no job', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(
      owner(),
      projectId,
      ['material_ordered', 'dispatched'],
      [here.people.installer.userId],
    );
    const liveOf = async () =>
      (
        await owner().call<{ userId: string; liveProjects: number }[]>(
          'GET',
          '/projects/people?role=crew',
        )
      ).body.find((one) => one.userId === here.people.installer.userId)?.liveProjects;
    const before = await liveOf();
    await acted(owner(), projectId, 'move-back', { from: 'dispatched' });
    expect(await liveOf()).toBe((before ?? 0) - 1);
  });

  it('an undone dispatch goes back to the day Material ordered began, and the real day is taken again', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await acted(owner(), projectId, 'move', { to: 'material_ordered' });
    const ordered = dayFromToday(-2);
    const db = world.pools.admin.db;
    await db
      .update(project)
      .set({ stageEnteredAt: new Date(Date.now() - 2 * DAY_MS) })
      .where(eq(project.id, projectId));
    await db
      .update(projectStageTransition)
      .set({ enteredOn: ordered })
      .where(
        and(
          eq(projectStageTransition.projectId, projectId),
          eq(projectStageTransition.toStage, 'material_ordered'),
        ),
      );
    const crew = [here.people.installer.userId];
    await acted(owner(), projectId, 'dispatch', { crew, leftOn: dayFromToday(0) });
    const undone = await acted(owner(), projectId, 'undo');
    expect(undone).toMatchObject({ stage: 'material_ordered', enteredOn: ordered });
    const again = await acted(owner(), projectId, 'dispatch', { crew, leftOn: dayFromToday(-1) });
    expect(again).toMatchObject({ stage: 'dispatched', enteredOn: dayFromToday(-1) });
  });
});
