import { randomUUID } from 'node:crypto';
import { SKY_TILE_UNAVAILABLE } from '@heliogrid/contracts';
import {
  EMPTY_STUDIO_DOCUMENT,
  FOUNDER_ROLE,
  SKY_TICKET_SECONDS,
  skyRealDetailMetres,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  memoryCacheControl,
  memoryTileBytes,
  uncoveredLatitude,
} from '../../src/modules/studio/internal/sky-picture-source.memory';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aSitedDesign,
  roundThePin,
  sangli,
  sourceOf,
  ticketed,
  tileAt,
  tileOf,
  tilesOf,
  zoomCap,
  zoomCoarsest,
} from './sky-support';
import {
  aDesign,
  aLead,
  aSite,
  aStaffedCompany,
  openStudioWorld,
  type StudioWorld,
  saveSite,
} from './support';

/**
 * The sky picture as tiles, on the wire (`T-M05-002a`): what a site's picture is — its real
 * detail, the zooms worth asking at, the ground it may be fetched for — and each tile as the map
 * service gives it. No tile past the site's reach or off its zooms is given, and the provider is
 * never asked for one. Who may ask is `sky-tiles-access.test.ts`.
 */

const here = aStaffedCompany('Sky Tiles EPC', { owner: [FOUNDER_ROLE] });

/** A roof drawn 900 m east of the pin: past the 300 m a site with no roof may fetch. */
const FAR_ROOF = {
  corners: [
    { east: 900, north: 0 },
    { east: 910, north: 0 },
    { east: 910, north: 8 },
  ],
  edges: ['traced', 'traced', 'traced'],
  tracedOn: 'sky',
};
const ON_THE_FAR_ROOF = { east: 905, north: 4 };
/** 300 m round the pin and the roof: the roof's far corner, 910 m east and 8 m north, and 300 m on. */
const ROUND_THE_FAR_ROOF = { west: -300, east: 1_210, south: -300, north: 308 };
const PAST_THE_REACH = { east: 800, north: 0 };
/** The ticket's life is told to the second; the clock moves while the answer travels. */
const CLOCK_SLACK_SECONDS = 2;
const TO_THE_NANOMETRE = 9;

const MS_PER_SECOND = 1_000;

const skip = skipWithoutDatabase(
  'SKY TILES PROOF',
  'What a site’s sky picture is, and that no tile past its reach is given, are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('The sky picture as tiles, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openStudioWorld([here]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await world.close();
  });

  it('a site’s picture: its real detail, zooms no finer than the market’s cap, 300 m round the pin, and a ticket for an hour', async () => {
    const designId = await aSitedDesign(owner());
    const before = Date.now();
    const reply = await tilesOf(owner(), designId);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.headers.get('cache-control')).toBe('no-store');
    const facts = reply.body;
    if (facts.kind !== 'tiles') throw new Error('the site has no picture');
    // The test provider cuts tiles to zoom 21; India's pack says true detail ends at 19.
    expect(facts).toMatchObject({
      source: 'google',
      credit: 'Test imagery',
      takenOn: '2025-10-17',
      zoomMin: zoomCoarsest,
      zoomMax: zoomCap,
      reach: roundThePin,
    });
    expect(facts.metresPerPixel).toBeCloseTo(
      skyRealDetailMetres(sangli.latitude, zoomCap),
      TO_THE_NANOMETRE,
    );
    const lasts = (Date.parse(facts.ticketUntil) - before) / MS_PER_SECOND;
    expect(lasts).toBeGreaterThan(SKY_TICKET_SECONDS - CLOCK_SLACK_SECONDS);
    expect(lasts).toBeLessThanOrEqual(SKY_TICKET_SECONDS + 1);
  });

  it('a tile travels as the provider’s own JPEG, with the provider’s word on keeping it', async () => {
    const designId = await aSitedDesign(owner());
    const { ticket } = await ticketed(owner(), designId);
    for (let zoom = zoomCoarsest; zoom <= zoomCap; zoom += 1) {
      const reply = await tileOf(owner(), designId, tileAt(zoom), ticket);
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.headers.get('content-type')).toBe('image/jpeg');
      expect(reply.headers.get('cache-control')).toBe(memoryCacheControl);
      expect(reply.headers.get('etag')).toBe('"test-tile"');
      // The bytes themselves, not a description of them: the JPEG's own length.
      expect(Number(reply.headers.get('content-length'))).toBe(memoryTileBytes);
    }
  });

  it.each([
    ['a provider that lets anyone keep a tile', 'public, max-age=600', 'private, max-age=600'],
    [
      'a provider that says more than how long',
      'private, max-age=86400, must-revalidate',
      'private, max-age=86400',
    ],
    ['a provider that says nothing', null, 'no-store'],
    ['a provider that says no time', 'public', 'no-store'],
  ])(
    '%s: the reader’s own browser keeps the tile, and no shared cache does',
    async (_what, said, kept) => {
      const designId = await aSitedDesign(owner());
      const { ticket } = await ticketed(owner(), designId);
      vi.spyOn(sourceOf(world), 'tile').mockResolvedValueOnce({
        bytes: Buffer.from('tile'),
        cacheControl: said,
        etag: null,
      });
      const reply = await tileOf(owner(), designId, tileAt(zoomCap), ticket);
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.headers.get('cache-control')).toBe(kept);
    },
  );

  it('a roof past 300 m grows the reach, and its tiles are given', async () => {
    const designId = await aSitedDesign(owner());
    const before = await ticketed(owner(), designId);
    const atTheRoof = tileAt(zoomCap, ON_THE_FAR_ROOF);
    expect((await tileOf(owner(), designId, atTheRoof, before.ticket)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    const saved = await owner().call('PUT', `/designs/${designId}/document`, {
      baseVersion: 0,
      document: {
        ...EMPTY_STUDIO_DOCUMENT,
        picture: 'sky',
        roofs: [{ id: randomUUID(), ...FAR_ROOF }],
      },
      opening: randomUUID(),
    });
    expect(saved.status).toBe(HttpStatus.OK);
    const after = await ticketed(owner(), designId);
    expect(after.reach).toEqual(ROUND_THE_FAR_ROOF);
    expect((await tileOf(owner(), designId, atTheRoof, after.ticket)).status).toBe(HttpStatus.OK);
  });

  it.each([
    ['a tile past the reach', () => tileAt(zoomCap, PAST_THE_REACH)],
    ['a zoom above the cap', () => tileAt(zoomCap + 1)],
    ['a zoom below the coarsest', () => tileAt(zoomCoarsest - 1)],
  ])('%s is not found, and the provider is never asked', async (_what, key) => {
    const designId = await aSitedDesign(owner());
    const { ticket } = await ticketed(owner(), designId);
    const asked = vi.spyOn(sourceOf(world), 'tile');
    expect((await tileOf(owner(), designId, key(), ticket)).status).toBe(HttpStatus.NOT_FOUND);
    expect(asked).not.toHaveBeenCalled();
  });

  it('a tile the provider does not hold is not found; a provider that does not answer says so', async () => {
    const designId = await aSitedDesign(owner());
    const { ticket } = await ticketed(owner(), designId);
    vi.spyOn(sourceOf(world), 'tile').mockResolvedValueOnce(null);
    expect((await tileOf(owner(), designId, tileAt(zoomCap), ticket)).status).toBe(
      HttpStatus.NOT_FOUND,
    );
    vi.spyOn(sourceOf(world), 'tile').mockRejectedValueOnce(new Error('tile answered 500'));
    const down = await tileOf(owner(), designId, tileAt(zoomCap), ticket);
    expect(down.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(down.body).toMatchObject({ error: { code: SKY_TILE_UNAVAILABLE } });
    expect(down.headers.get('content-type')).toContain('application/json');
  });

  it('a site with no picture says why: no pin, a place the provider does not cover, a provider that does not answer', async () => {
    const unsited = await aDesign(owner(), await aLead(owner()));
    expect((await tilesOf(owner(), unsited.design.id)).body).toEqual({
      kind: 'none',
      gap: 'not_covered',
    });
    const uncovered = await aDesign(owner(), await aLead(owner()));
    await saveSite(
      owner(),
      uncovered.design.id,
      aSite({ pin: { latitude: uncoveredLatitude, longitude: sangli.longitude } }),
    );
    expect((await tilesOf(owner(), uncovered.design.id)).body).toEqual({
      kind: 'none',
      gap: 'not_covered',
    });
    const designId = await aSitedDesign(owner());
    vi.spyOn(sourceOf(world), 'factsAt').mockRejectedValueOnce(new Error('viewport answered 500'));
    expect((await tilesOf(owner(), designId)).body).toEqual({
      kind: 'none',
      gap: 'not_answered',
    });
  });
});
