import type { ProjectJob } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  acted,
  actOn,
  aLead,
  aStaffedCompany,
  aStoredFile,
  aWin,
  aWonProject,
  boardOf,
  type Caller,
  dayFromToday,
  detailOf,
  markWon,
  openProjectsWorld,
  ownLead,
  type ProjectsWorld,
  preset,
  SEEDED_STEPS,
} from './support';

/**
 * Who sees which project (`F2-14`, the projects row; ruling 2026-11-10), on every read and act: the
 * owner all, a project manager the ones they manage, an installer the ones whose crew names them,
 * a seller the deals they sold — read-only — and a surveyor none. A project out of reach, or in
 * another company, does not exist for the reader: 404, never 403.
 */

const here = aStaffedCompany('Project Scope EPC', {
  owner: [FOUNDER_ROLE],
  pmA: [preset.project_manager],
  pmB: [preset.project_manager],
  installer: [preset.installation_team_member],
  seller: [preset.sales_executive],
  surveyor: [preset.survey_engineer],
});
const there = aStaffedCompany('Project Scope Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROJECT SCOPE PROOF',
  'Who may see and act on a project is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('project visibility, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  /** Sold by the seller, managed by pmA, crewed by the installer, standing at Dispatched. */
  let crewed: string;
  /** Won by the owner, managed by pmB, no crew, standing at Won. */
  let other: string;
  const as = (who: keyof typeof here.members): Caller => world.as(here.members[who]);
  const liveIds = async (caller: Caller) => (await boardOf(caller)).live.map((card) => card.id);

  beforeAll(async () => {
    world = await openProjectsWorld([here, there]);
    const leadId = await aLead(as('owner'));
    await ownLead(world, leadId, here.people.seller.userId);
    const won = await markWon(as('seller'), leadId, aWin(here.people.pmA.userId));
    if (won.status !== HttpStatus.CREATED) throw new Error(`seller's win: ${won.status}`);
    crewed = won.body.projectId;
    await acted(as('owner'), crewed, 'move', { to: 'material_ordered' });
    await acted(as('owner'), crewed, 'dispatch', {
      crew: [here.people.installer.userId],
      leftOn: dayFromToday(0),
    });
    other = (await aWonProject(as('owner'), here.people.pmB.userId)).projectId;
  });

  afterAll(async () => {
    await world.close();
  });

  it('the owner sees every project of the company', async () => {
    expect(await liveIds(as('owner'))).toEqual(expect.arrayContaining([crewed, other]));
  });

  it('a project manager sees only the projects they manage', async () => {
    expect(await liveIds(as('pmA'))).toEqual([crewed]);
    expect((await detailOf(as('pmA'), crewed)).status).toBe(HttpStatus.OK);
    expect((await detailOf(as('pmA'), other)).status).toBe(HttpStatus.NOT_FOUND);
    const act = await actOn(as('pmA'), other, 'move', { to: 'material_ordered' });
    expect(act.status).toBe(HttpStatus.NOT_FOUND);
  });

  it("an installer's jobs are only the ones whose crew names them, with no price", async () => {
    const jobs = await as('installer').call<ProjectJob[]>('GET', '/projects/jobs');
    expect(jobs.status).toBe(HttpStatus.OK);
    expect(jobs.body.map((job) => job.id)).toEqual([crewed]);
    expect(jobs.body[0]?.steps).toHaveLength(SEEDED_STEPS);
    expect(Object.keys(jobs.body[0] ?? {})).not.toContain('finalValue');
    const none = await as('pmB').call<ProjectJob[]>('GET', '/projects/jobs');
    expect(none.body).toEqual([]);
  });

  it('an installer sees only the projects whose crew names them, and may tick but not move', async () => {
    expect(await liveIds(as('installer'))).toEqual([crewed]);
    const detail = (await detailOf(as('installer'), crewed)).body;
    expect(detail.acts).toEqual({ stages: false, documents: false, steps: true });
    expect((await detailOf(as('installer'), other)).status).toBe(HttpStatus.NOT_FOUND);
    const move = await actOn(as('installer'), crewed, 'move', { to: 'installation' });
    expect(move.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('an installer reads no paper — no checklist, no other file, no lead file — and opens only a step photo (M08-43)', async () => {
    const document = await aStoredFile(world, here.company.tenantId, {
      kind: 'project',
      ref: crewed,
    });
    const photo = await aStoredFile(world, here.company.tenantId, { kind: 'project', ref: crewed });
    await acted(as('owner'), crewed, 'files', {
      fileId: document,
      slot: 'document',
      slotKey: 'signed_proposal',
      name: 'Signed proposal',
    });
    await acted(as('owner'), crewed, 'files', {
      fileId: photo,
      slot: 'step',
      slotKey: 'mounting_structure',
      name: 'Rails up',
    });
    const detail = (await detailOf(as('installer'), crewed)).body;
    expect(detail).toMatchObject({ documents: [], otherFiles: [], leadFiles: [] });
    const read = (fileId: string) => as('installer').call('GET', `/files/${fileId}/download-url`);
    expect((await read(document)).status).toBe(HttpStatus.FORBIDDEN);
    expect((await read(photo)).status).toBe(HttpStatus.OK);
    expect((await detailOf(as('owner'), crewed)).body.documents.length).toBeGreaterThan(0);
  });

  it('a project manager hands their project to another manager, and it leaves their reach', async () => {
    const handed = (await aWonProject(as('owner'), here.people.pmA.userId)).projectId;
    const reply = await actOn(as('pmA'), handed, 'details', { managerId: here.people.pmB.userId });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.manager).toMatchObject({ userId: here.people.pmB.userId });
    expect((await detailOf(as('pmA'), handed)).status).toBe(HttpStatus.NOT_FOUND);
    expect((await detailOf(as('pmB'), handed)).status).toBe(HttpStatus.OK);
  });

  it('a seller reads the deals they sold, and may do nothing on them', async () => {
    expect(await liveIds(as('seller'))).toEqual([crewed]);
    const detail = (await detailOf(as('seller'), crewed)).body;
    expect(detail.soldBy).toMatchObject({ userId: here.people.seller.userId });
    expect(detail.acts).toEqual({ stages: false, documents: false, steps: false });
    for (const [verb, body] of [
      ['move', { to: 'installation' }],
      ['steps/tick', { step: 'mounting_structure', doneBy: null }],
      ['documents/not-needed', { row: 'utility_feasibility', reason: 'n/a' }],
    ] as const) {
      expect((await actOn(as('seller'), crewed, verb, body)).status).toBe(HttpStatus.FORBIDDEN);
    }
    expect((await detailOf(as('seller'), other)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it("a surveyor's board is empty and every project is not found", async () => {
    const board = await boardOf(as('surveyor'));
    expect(board.live).toEqual([]);
    expect(board.stages.every((stage) => stage.count === 0)).toBe(true);
    expect((await detailOf(as('surveyor'), crewed)).status).toBe(HttpStatus.NOT_FOUND);
  });

  it("another company's project is not found on any read or act", async () => {
    const stranger = world.as(there.members.owner);
    expect(await liveIds(stranger)).not.toContain(crewed);
    for (const reply of [
      await detailOf(stranger, crewed),
      await stranger.call('GET', `/projects/${crewed}/handover`),
      await actOn(stranger, crewed, 'move', { to: 'installation' }),
      await actOn(stranger, crewed, 'cancel', { reason: 'won_by_mistake', note: null }),
    ]) {
      expect(reply.status).toBe(HttpStatus.NOT_FOUND);
    }
  });

  it('the pickers offer managers and installers of this company only', async () => {
    const managers = await as('owner').call<{ userId: string }[]>(
      'GET',
      '/projects/people?role=manager',
    );
    expect(managers.status).toBe(HttpStatus.OK);
    expect(managers.body.map((one) => one.userId).sort()).toEqual(
      [here.people.owner.userId, here.people.pmA.userId, here.people.pmB.userId].sort(),
    );
    const crew = await as('owner').call<{ userId: string; liveProjects: number }[]>(
      'GET',
      '/projects/people?role=crew',
    );
    expect(crew.status).toBe(HttpStatus.OK);
    expect(crew.body).toEqual([
      expect.objectContaining({ userId: here.people.installer.userId, liveProjects: 1 }),
    ]);
  });
});
