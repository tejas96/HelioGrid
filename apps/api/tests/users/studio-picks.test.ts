import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aStaffedCompany, openStudioWorld, preset, type StudioWorld } from '../studio/support';
import { skipWithoutDatabase } from '../support/fixture';

/**
 * A person's studio picks (`T-M05-002`, part b), over HTTP: the helpers turned off and how a number
 * is set are the person's own, kept on their account, so they come back in every session; a person
 * changes only their own; a pick the studio does not know is refused with the field it names.
 */

interface Picks {
  readonly studioHelpersOff?: readonly string[];
  readonly numberEntry?: string;
}
interface Session {
  readonly actor?: Picks & { readonly userId: string };
}

const here = aStaffedCompany('Studio Picks EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'STUDIO PICKS PROOF',
  'The studio picks saved on the account are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('a person’s studio picks, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);
  const rep = () => world.as(here.members.rep);
  const picksOf = async (caller: ReturnType<typeof owner>) =>
    (await caller.call<Session>('GET', '/auth/session')).body.actor;

  beforeAll(async () => {
    world = await openStudioWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('an account no one has changed has every helper on and the slider first', async () => {
    expect(await picksOf(rep())).toMatchObject({ studioHelpersOff: [], numberEntry: 'slider' });
  });

  it('picks saved come back in the next session, and the teammate’s stay their own', async () => {
    const saved = await owner().call<Picks>('PATCH', '/users/me', {
      studioHelpersOff: ['square', 'buildings'],
      numberEntry: 'box',
    });
    expect(saved.status).toBe(HttpStatus.OK);
    expect(saved.body).toMatchObject({
      studioHelpersOff: ['square', 'buildings'],
      numberEntry: 'box',
    });
    expect(await picksOf(owner())).toMatchObject({
      studioHelpersOff: ['square', 'buildings'],
      numberEntry: 'box',
    });
    expect(await picksOf(rep())).toMatchObject({ studioHelpersOff: [], numberEntry: 'slider' });
  });

  it('a body naming another account changes only mine', async () => {
    const theirs = (await picksOf(rep()))?.userId;
    const reply = await owner().call('PATCH', '/users/me', { id: theirs, numberEntry: 'slider' });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(await picksOf(rep())).toMatchObject({ numberEntry: 'slider', studioHelpersOff: [] });
  });

  it.each([
    ['a helper it does not know', { studioHelpersOff: ['magic'] }, 'studioHelpersOff.0'],
    ['a helper named twice', { studioHelpersOff: ['square', 'square'] }, 'studioHelpersOff'],
    ['a way to set numbers it does not know', { numberEntry: 'dial' }, 'numberEntry'],
    ['a list that is not a list', { studioHelpersOff: 'square' }, 'studioHelpersOff'],
  ])('%s is refused with its field, and nothing changes', async (_why, body, path) => {
    const before = await picksOf(rep());
    const reply = await rep().call<{ error: { details?: { path: string }[] } }>(
      'PATCH',
      '/users/me',
      body,
    );
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body.error.details?.map((detail) => detail.path)).toContain(path);
    expect(await picksOf(rep())).toEqual(before);
  });
});
