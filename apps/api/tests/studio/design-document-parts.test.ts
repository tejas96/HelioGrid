import { randomUUID } from 'node:crypto';
import { EMPTY_STUDIO_DOCUMENT, FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDesign,
  aLead,
  aStaffedCompany,
  documentOf,
  openStudioWorld,
  type StudioWorld,
  saveSite,
} from './support';

/**
 * What part e stores on a roof, on the wire (`T-M05-002`, part e), one release before any studio
 * writes it: a design with roofs standing on roofs and sides with their own settings saves and
 * reads back whole; a link that cannot hold is never stored; a design may hold up to 200 roofs;
 * and another company still finds no design.
 */

const here = aStaffedCompany('Design Parts EPC', { owner: [FOUNDER_ROLE] });
const there = aStaffedCompany('Design Parts Other EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'DESIGN PARTS PROOF',
  'Roofs standing on roofs saved, read back and refused for a link that cannot hold are UNPROVEN on the wire in this run.',
);

interface Box {
  readonly west: number;
  readonly south: number;
  readonly wide: number;
  readonly deep: number;
}
const roofAt = ({ west, south, wide, deep }: Box) => ({
  id: randomUUID(),
  corners: [
    { east: west, north: south },
    { east: west + wide, north: south },
    { east: west + wide, north: south + deep },
    { east: west, north: south + deep },
  ],
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
});
/** A terrace of 10 m by 8 m, and the stair room on its corner. */
const TERRACE_BOX: Box = { west: 0, south: 0, wide: 10, deep: 8 };
const STAIR_BOX: Box = { west: 0, south: 0, wide: 3, deep: 3 };
/** The most roofs a stored design holds, and a grid that keeps that many clear of each other. */
const ROOFS_READ = 200;
const GRID = { across: 20, pitch: 12, wide: 8, deep: 6 };
const TALL_PARAPET_M = 3.5;
const SIDE_PARAPET_M = 1.5;

describe.skipIf(skip)('What part e stores on a roof, over HTTP against a migrated database', () => {
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

  const TERRACE = {
    ...roofAt(TERRACE_BOX),
    material: { type: 'rcc', setBy: 'system', confirmed: false },
    parapet: { allRound: true, metres: 1, setBy: 'system' },
    setback: { metres: 0.5, setBy: 'system' },
    sides: [{ parapet: false }, {}, { parapetM: SIDE_PARAPET_M }, {}],
  };
  const STAIR = {
    ...roofAt(STAIR_BOX),
    height: { metres: 3, setBy: 'system' },
    kind: { is: 'stair_room', setBy: 'system' },
    on: TERRACE.id,
    sides: [{}, { stairsAt: SIDE_PARAPET_M, stairsBy: 'system' }, {}, {}],
  };
  const withRoofs = (...roofs: unknown[]) => ({ ...EMPTY_STUDIO_DOCUMENT, picture: 'sky', roofs });
  const save = (caller: ReturnType<typeof owner>, designId: string, document: unknown) =>
    caller.call('PUT', `/designs/${designId}/document`, {
      baseVersion: 0,
      document,
      opening: randomUUID(),
    });

  it('a stair room on its roof, with each side’s own settings, saves and reads back whole', async () => {
    const designId = await aSitedDesign();
    const sent = withRoofs(TERRACE, STAIR);
    expect((await save(owner(), designId, sent)).status).toBe(HttpStatus.OK);
    expect((await documentOf(owner(), designId)).body.document).toEqual(sent);
  });

  it.each([
    [
      'a roof standing on a roof the design does not hold',
      [TERRACE, { ...STAIR, on: randomUUID() }],
    ],
    ['a roof standing on itself', [TERRACE, { ...STAIR, on: STAIR.id }]],
    ['two roofs standing on each other', [{ ...TERRACE, on: STAIR.id }, STAIR]],
    [
      'a roof that is part of a roof the design does not hold',
      [TERRACE, { ...STAIR, partOf: randomUUID() }],
    ],
    ['a side list that does not match the corners', [{ ...TERRACE, sides: [{}, {}, {}] }]],
    [
      'a parapet taller than 3 m',
      [{ ...TERRACE, parapet: { allRound: true, metres: TALL_PARAPET_M, setBy: 'person' } }],
    ],
  ])('%s is refused, and nothing is saved', async (_why, roofs) => {
    const designId = await aSitedDesign();
    const reply = await save(owner(), designId, withRoofs(...roofs));
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
  });

  it('a design of 200 roofs saves and reads back; one more is refused', async () => {
    const designId = await aSitedDesign();
    const roofs = Array.from({ length: ROOFS_READ + 1 }, (_, i) =>
      roofAt({
        west: (i % GRID.across) * GRID.pitch,
        south: Math.floor(i / GRID.across) * GRID.pitch,
        wide: GRID.wide,
        deep: GRID.deep,
      }),
    );
    expect((await save(owner(), designId, withRoofs(...roofs))).status).toBe(
      HttpStatus.BAD_REQUEST,
    );
    expect((await save(owner(), designId, withRoofs(...roofs.slice(0, ROOFS_READ)))).status).toBe(
      HttpStatus.OK,
    );
    expect((await documentOf(owner(), designId)).body.document.roofs).toHaveLength(ROOFS_READ);
  });

  it('another company finds no design to save a roof’s parts on, and it stays as it was', async () => {
    const designId = await aSitedDesign();
    const reply = await save(world.as(there.members.owner), designId, withRoofs(TERRACE, STAIR));
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
    expect((await documentOf(owner(), designId)).body.version).toBe(0);
  });
});
