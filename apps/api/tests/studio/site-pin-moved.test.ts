import { randomUUID } from 'node:crypto';
import {
  coordinateOf,
  EMPTY_STUDIO_DOCUMENT,
  FOUNDER_ROLE,
  type GroundPoint,
  roundPin,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  documentOf,
  openStudioWorld,
  refusalOf,
  type StudioWorld,
  saveSite,
} from './support';

/**
 * A moved pin on the wire: a roof is stored in metres from the pin, so a fixed pin carries every
 * design's roofs back onto their houses; a pin moved to another site is refused until the person
 * agrees the roofs go; and the pin moves only through Site details.
 */

const here = aStaffedCompany('Site Pin Moved EPC', { owner: [FOUNDER_ROLE] });

const PIN = aSite().pin;
/** The site's pin moved this far east and north, as it is stored. */
const pinAt = (east: number, north: number) => roundPin(coordinateOf(PIN, { east, north }));
/** The picture stretched by a first true length, which stretches the shift the same. */
const PICTURE_SCALE = 1.25;
/** A pin fixed onto the right house, and one moved to another town. */
const FIX_M = 20;
const OTHER_SITE_M = 2_000;

const ROOF_CORNERS = [
  { east: 0, north: 0 },
  { east: 8, north: 0 },
  { east: 8, north: 6 },
  { east: 0, north: 6 },
];
const WITH_ROOF = {
  ...EMPTY_STUDIO_DOCUMENT,
  picture: 'sky',
  drawnOn: { source: 'google', takenOn: '2025-10-04' },
  roofs: [
    {
      id: randomUUID(),
      corners: ROOF_CORNERS,
      edges: ['typed', 'traced', 'traced', 'traced'],
      tracedOn: 'sky',
      height: null,
    },
  ],
  pictureScale: PICTURE_SCALE,
} as const;

const skip = skipWithoutDatabase(
  'SITE PIN MOVED PROOF',
  'That a moved pin keeps every roof on its house, and asks before another site clears them, is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('A moved pin, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openStudioWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  /** A lead with a roof drawn on two designs and none on a third. */
  async function aDrawnLead() {
    const leadId = await aLead(owner());
    const designs: string[] = [];
    for (const drawn of [true, true, false]) {
      const made = await aDesign(owner(), leadId);
      expect((await saveSite(owner(), made.design.id)).status).toBe(HttpStatus.OK);
      const document = drawn ? WITH_ROOF : { ...EMPTY_STUDIO_DOCUMENT, picture: 'sky' };
      const saved = await owner().call('PUT', `/designs/${made.design.id}/document`, {
        baseVersion: 0,
        document,
        opening: randomUUID(),
      });
      expect(saved.status).toBe(HttpStatus.OK);
      designs.push(made.design.id);
    }
    return { leadId, designs };
  }
  const documentsOf = (designs: readonly string[]) =>
    Promise.all(designs.map(async (id) => (await documentOf(owner(), id)).body));
  /** Each corner to the centimetre: a stored pin keeps six decimals, about 0.1 m. */
  const cornersOf = (corners: readonly GroundPoint[] | undefined) =>
    corners?.map((c) => ({ east: Math.round(c.east * 10), north: Math.round(c.north * 10) }));

  it('a fixed pin keeps every design’s roofs on their house, each a new version; an empty one is left alone', async () => {
    const { designs } = await aDrawnLead();
    const moved = pinAt(FIX_M, 0);
    const reply = await saveSite(owner(), designs[0] as string, aSite({ pin: moved }));
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.site.pin).toEqual(moved);
    const [first, second, empty] = await documentsOf(designs);
    const shift = FIX_M * PICTURE_SCALE;
    const back = ROOF_CORNERS.map((c) => ({ east: c.east - shift, north: c.north }));
    for (const drawn of [first, second]) {
      expect(cornersOf(drawn?.document.roofs[0]?.corners)).toEqual(cornersOf(back));
      expect(drawn?.document.pictureScale).toBe(PICTURE_SCALE);
      expect(drawn?.version).toBe(2);
    }
    expect(empty?.version).toBe(1);
  });

  it('a studio still open on the old drawing is refused its next save', async () => {
    const { designs } = await aDrawnLead();
    const designId = designs[0] as string;
    await saveSite(owner(), designId, aSite({ pin: pinAt(FIX_M, 0) }));
    const stale = await owner().call('PUT', `/designs/${designId}/document`, {
      baseVersion: 1,
      document: WITH_ROOF,
      opening: randomUUID(),
    });
    expect(stale.status).toBe(HttpStatus.CONFLICT);
  });

  it('the same pin sent again writes no drawing', async () => {
    const { designs } = await aDrawnLead();
    expect((await saveSite(owner(), designs[0] as string, aSite())).status).toBe(HttpStatus.OK);
    expect((await documentsOf(designs)).map((d) => d?.version)).toEqual([1, 1, 1]);
  });

  it('a pin moved to another site is refused, and nothing is written', async () => {
    const { designs } = await aDrawnLead();
    const designId = designs[0] as string;
    const reply = await saveSite(owner(), designId, aSite({ pin: pinAt(OTHER_SITE_M, 0) }));
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(refusalOf(reply)).toBe('roofs_off_site');
    expect(
      (await owner().call<{ site: { pin: unknown } }>('GET', `/designs/${designId}`)).body.site.pin,
    ).toEqual(PIN);
    expect((await documentsOf(designs)).map((d) => d?.version)).toEqual([1, 1, 1]);
  });

  it('another site, once agreed, clears every roof and what it set on the picture', async () => {
    const { designs } = await aDrawnLead();
    const moved = pinAt(OTHER_SITE_M, 0);
    const reply = await saveSite(
      owner(),
      designs[0] as string,
      aSite({ pin: moved, removeRoofs: true }),
    );
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.site.pin).toEqual(moved);
    const [first, second, empty] = await documentsOf(designs);
    for (const drawn of [first, second]) {
      expect(drawn?.document).toEqual({ ...EMPTY_STUDIO_DOCUMENT, picture: 'sky' });
      expect(drawn?.version).toBe(2);
    }
    expect(empty?.version).toBe(1);
  });

  it('the lead edit route no longer takes the pin', async () => {
    const { leadId, designs } = await aDrawnLead();
    const reply = await owner().call('PATCH', `/leads/${leadId}`, {
      sitePin: pinAt(FIX_M, 0),
      capturedAt: new Date().toISOString(),
    });
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect((await documentsOf(designs)).map((d) => d?.version)).toEqual([1, 1, 1]);
  });
});
