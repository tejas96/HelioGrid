import type { Notification, Paginated } from '@heliogrid/contracts';
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
  openProjectsWorld,
  type ProjectsWorld,
  refusalOf,
  walk,
} from './support';

/**
 * Install ticks as proof on the wire (`M08-14`, `M08-41`…`M08-45`, ruling 2026-11-10): the first
 * tick moves a dispatched project into Installation and the last into Electrical metering, with no
 * one named as the mover; a tick that lands further back waits for the one tap *Proof came early*
 * asks, and that tap moves only to a stage the files on the project prove.
 */

const here = aStaffedCompany('Project Proof EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'PROJECT PROOF PROOF',
  'The install ticks and the proof they carry are UNPROVEN on the wire in this run.',
);

const STEPS = [
  'mounting_structure',
  'panels_fixed',
  'inverter_mounted',
  'earthing_and_arrester',
  'ac_dc_wiring',
  'final_check',
] as const;

describe.skipIf(skip)('install ticks as proof, over HTTP against a migrated database', () => {
  let world: ProjectsWorld;
  const owner = () => world.as(here.members.owner);
  const ownerId = () => here.people.owner.userId;
  const tick = (projectId: string, step: string, doneBy: string | null = null) =>
    actOn(owner(), projectId, 'steps/tick', { step, doneBy });

  beforeAll(async () => {
    world = await openProjectsWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('at Dispatched the first tick moves the project into Installation by itself', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered', 'dispatched']);
    const reply = await tick(projectId, 'mounting_structure', 'Ravi (contract crew)');
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.stage).toBe('installation');
    expect(reply.body.journey.at(-1)).toMatchObject({
      from: 'dispatched',
      to: 'installation',
      cause: 'proof',
      proof: 'first_install_step',
      movedBy: null,
    });
    expect(reply.body.steps[0]).toMatchObject({
      step: 'mounting_structure',
      tickedBy: { userId: ownerId() },
      doneBy: 'Ravi (contract crew)',
    });
  });

  it('the manager whose own tick moved the project is not told of their own work', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered', 'dispatched']);
    expect((await tick(projectId, 'mounting_structure')).body.stage).toBe('installation');
    const inbox = await owner().call<Paginated<Notification>>('GET', '/notifications');
    const moved = inbox.body.items.filter(
      (one) => one.type === 'project_moved' && one.subjectRef === projectId,
    );
    expect(moved).toEqual([]);
  });

  it('the last of the six ticks moves it into Electrical metering', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered', 'dispatched']);
    for (const step of STEPS.slice(0, -1)) {
      expect((await tick(projectId, step)).body.stage).toBe('installation');
    }
    const last = await tick(projectId, 'final_check');
    expect(last.body.stage).toBe('electrical_metering');
    expect(last.body.journey.at(-1)).toMatchObject({
      from: 'installation',
      to: 'electrical_metering',
      cause: 'proof',
      proof: 'last_install_step',
      movedBy: null,
    });
    const card = (await boardOf(owner())).live.find((one) => one.id === projectId);
    expect(card?.steps).toEqual({ ticked: 6, total: 6 });
  });

  it('a tick that lands early leaves the stage and asks one tap', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered']);
    const early = await tick(projectId, 'mounting_structure');
    expect(early.body).toMatchObject({
      stage: 'material_ordered',
      todo: 'proof_early',
      earlyProofTo: 'installation',
    });
    const card = (await boardOf(owner())).live.find((one) => one.id === projectId);
    expect(card).toMatchObject({ todo: 'proof_early', earlyProofTo: 'installation' });
  });

  it('confirming the early proof moves to what it shows, passing the stage between', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered']);
    await tick(projectId, 'mounting_structure');
    const confirmed = await acted(owner(), projectId, 'confirm-proof', { to: 'installation' });
    expect(confirmed).toMatchObject({ stage: 'installation', todo: null, earlyProofTo: null });
    expect(confirmed.journey.at(-1)).toMatchObject({
      from: 'material_ordered',
      to: 'installation',
      cause: 'proof',
      proof: 'first_install_step',
      movedBy: { userId: ownerId() },
    });
  });

  it.each([
    ['a stage no file proves', 'commissioned'],
    ['a stage the ticks do not reach yet', 'electrical_metering'],
  ])('confirming proof of %s is refused', async (_case, to) => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered']);
    await tick(projectId, 'mounting_structure');
    const reply = await actOn(owner(), projectId, 'confirm-proof', { to });
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('no_proof_ahead');
  });

  it('a step ticked twice, or unticked twice, is refused; an untick moves no stage', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    await walk(owner(), projectId, ['material_ordered', 'dispatched']);
    await tick(projectId, 'mounting_structure');
    expect(refusalOf(await tick(projectId, 'mounting_structure'))).toBe('step_ticked');
    const unticked = await acted(owner(), projectId, 'steps/untick', {
      step: 'mounting_structure',
    });
    expect(unticked.stage).toBe('installation');
    expect(unticked.steps[0]).toMatchObject({ tickedAt: null, tickedBy: null });
    const again = await actOn(owner(), projectId, 'steps/untick', { step: 'mounting_structure' });
    expect(refusalOf(again)).toBe('step_not_ticked');
  });

  it('a step the project does not carry is refused as unknown', async () => {
    const { projectId } = await aWonProject(owner(), ownerId());
    const reply = await tick(projectId, 'no_such_step');
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('step_unknown');
  });
});
