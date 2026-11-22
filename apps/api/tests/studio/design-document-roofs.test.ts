import { randomUUID } from 'node:crypto';
import { designDocument } from '@heliogrid/db';
import { EMPTY_STUDIO_DOCUMENT, FOUNDER_ROLE, GROUND_REACH_M } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDesign,
  aLead,
  aStaffedCompany,
  documentOf,
  openStudioWorld,
  preset,
  type StudioWorld,
  saveSite,
} from './support';

/**
 * The design document's roofs on the wire (`T-M05-002`, part b): new fields of schema 1, so a
 * document saved before them reads as no roofs at the picture's own scale, and a roof saved before
 * heights stands at the system's; a roof whose edges cross is never stored; only the edit key
 * saves, and another company finds no design.
 */

const here = aStaffedCompany('Design Roofs EPC', {
  owner: [FOUNDER_ROLE],
  pm: [preset.project_manager],
});
const there = aStaffedCompany('Design Roofs Other EPC', { owner: [FOUNDER_ROLE] });
/** The picture stretched by the first true length: 8.32 m typed for 8 m traced. */
const PICTURE_SCALE = 1.04;

const skip = skipWithoutDatabase(
  'DESIGN ROOFS PROOF',
  'Roofs saved, read back, read from an older document and refused when crossed are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('The design document’s roofs, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openStudioWorld([here, there]);
  });

  afterAll(async () => {
    await world.close();
  });

  async function aSitedDesign(): Promise<string> {
    const made = await aDesign(owner(), await aLead(owner()));
    expect((await saveSite(owner(), made.design.id)).status).toBe(HttpStatus.OK);
    return made.design.id;
  }

  /** A roof drawn on the sky picture: 8 m by 6 m, its first length typed. */
  const ROOF = {
    id: randomUUID(),
    corners: [
      { east: 0, north: 0 },
      { east: 8, north: 0 },
      { east: 8, north: 6 },
      { east: 0, north: 6 },
    ],
    edges: ['typed', 'traced', 'traced', 'measured'],
    tracedOn: 'sky',
    height: { metres: 4.5, setBy: 'person' },
  } as const;
  const WITH_ROOF = {
    ...EMPTY_STUDIO_DOCUMENT,
    picture: 'sky',
    drawnOn: { source: 'google', takenOn: '2025-10-04' },
    roofs: [ROOF],
    pictureScale: PICTURE_SCALE,
  } as const;
  const saveRoofs = (caller: ReturnType<typeof owner>, designId: string, document: unknown) =>
    caller.call('PUT', `/designs/${designId}/document`, {
      baseVersion: 0,
      document,
      opening: randomUUID(),
    });

  it('a roof saved reads back whole; a document stored before roofs reads as none, at scale 1', async () => {
    const designId = await aSitedDesign();
    expect((await saveRoofs(owner(), designId, WITH_ROOF)).status).toBe(HttpStatus.OK);
    expect((await documentOf(owner(), designId)).body.document).toEqual(WITH_ROOF);
    await world.pools.admin.db
      .update(designDocument)
      // A body as the first studio saved it, before roofs: the stored envelope names its version alone.
      .set({
        body: { schemaVersion: 1, picture: 'sky', drawnOn: null } as { schemaVersion: number },
      })
      .where(eq(designDocument.designId, designId));
    const old = await documentOf(owner(), designId);
    expect(old.status).toBe(HttpStatus.OK);
    expect(old.body.document).toMatchObject({ roofs: [], pictureScale: 1 });
  });

  it('a roof stored before heights reads as standing at the system’s height', async () => {
    const designId = await aSitedDesign();
    expect((await saveRoofs(owner(), designId, WITH_ROOF)).status).toBe(HttpStatus.OK);
    const { height: _height, ...before } = ROOF;
    await world.pools.admin.db
      .update(designDocument)
      .set({ body: { ...WITH_ROOF, roofs: [before] } as { schemaVersion: number } })
      .where(eq(designDocument.designId, designId));
    const old = await documentOf(owner(), designId);
    expect(old.status).toBe(HttpStatus.OK);
    expect(old.body.document.roofs).toEqual([{ ...ROOF, height: null }]);
  });

  it('an old studio’s save without roofs, sent on a stale version, cannot wipe them', async () => {
    const designId = await aSitedDesign();
    expect((await saveRoofs(owner(), designId, WITH_ROOF)).status).toBe(HttpStatus.OK);
    const stale = await saveRoofs(owner(), designId, {
      schemaVersion: 1,
      picture: 'sky',
      drawnOn: null,
    });
    expect(stale.status).toBe(HttpStatus.CONFLICT);
    expect((await documentOf(owner(), designId)).body.document.roofs).toEqual([ROOF]);
  });

  it.each([
    ['a height under 0.3 m', { ...ROOF, height: { metres: 0.2, setBy: 'person' } }],
    ['a height set by no one it knows', { ...ROOF, height: { metres: 3, setBy: 'ai' } }],
    [
      'a roof whose edges cross',
      {
        ...ROOF,
        corners: [...ROOF.corners].reverse().slice(0, 2).concat(ROOF.corners.slice(0, 2)),
      },
    ],
    ['a roof with one trust too few', { ...ROOF, edges: ROOF.edges.slice(0, -1) }],
  ])('%s is refused, and nothing is saved', async (_why, roof) => {
    const designId = await aSitedDesign();
    const reply = await saveRoofs(owner(), designId, { ...WITH_ROOF, roofs: [roof] });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
  });

  it('a reader without the edit key may not save a roof; another company finds no design', async () => {
    const designId = await aSitedDesign();
    expect((await saveRoofs(world.as(here.members.pm), designId, WITH_ROOF)).status).toBe(
      HttpStatus.FORBIDDEN,
    );
    expect((await saveRoofs(world.as(there.members.owner), designId, WITH_ROOF)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
  });

  it('a corner past the site’s reach is refused', async () => {
    const designId = await aSitedDesign();
    const far = {
      ...ROOF,
      corners: [...ROOF.corners.slice(0, -1), { east: GROUND_REACH_M + 1, north: 0 }],
    };
    const reply = await saveRoofs(owner(), designId, { ...WITH_ROOF, roofs: [far] });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
