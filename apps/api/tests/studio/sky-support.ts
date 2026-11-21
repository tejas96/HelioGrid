import { SKY_TICKET_HEADER, type SkyTilesWire } from '@heliogrid/contracts';
import { type SkyTileKey, skyTilesInView } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { expect } from 'vitest';
import {
  SKY_PICTURE_SOURCE,
  type SkyPictureSource,
} from '../../src/modules/studio/internal/sky-picture-source';
import { aDesign, aLead, type Caller, type StudioWorld, saveSite } from './support';

/*
 * The sky tiles' proofs (`sky-tiles.test.ts`, `sky-tiles-access.test.ts`): the site every case
 * pins, the zooms India's pack allows over the test provider, and the two routes as a caller asks
 * them.
 */

/** The site every case pins: Sangli (`aSite`). */
export const sangli = { latitude: 16.8367, longitude: 74.5966 };
/** A roof site with no roof: 300 m round the pin (`SKY_REACH_ROUND_ROOFS_M`). */
export const roundThePin = { west: -300, east: 300, south: -300, north: 300 };
/** India's cap on true detail, and the coarsest zoom whose tiles cover 600 m at Sangli. */
export const zoomCap = 19;
export const zoomCoarsest = 16;

export const tilesOf = (caller: Caller, designId: string) =>
  caller.call<SkyTilesWire>('GET', `/designs/${designId}/sky-tiles`);

export const tileOf = (caller: Caller, designId: string, key: SkyTileKey, ticket: string | null) =>
  caller.call(
    'GET',
    `/designs/${designId}/sky-tiles/${key.z}/${key.x}/${key.y}`,
    undefined,
    ticket === null ? {} : { [SKY_TICKET_HEADER]: ticket },
  );

/** The tile under a point of the site's ground, at a zoom: under the pin unless told. */
export function tileAt(zoom: number, at = { east: 0, north: 0 }): SkyTileKey {
  const spot = { west: at.east - 1, east: at.east + 1, south: at.north - 1, north: at.north + 1 };
  const [key] = skyTilesInView(sangli, spot, spot, zoom, 0).tiles;
  if (key === undefined) throw new Error('no tile under the point');
  return key;
}

/** A design on a new lead of the caller's company, with its site in Sangli. */
export async function aSitedDesign(by: Caller): Promise<string> {
  const made = await aDesign(by, await aLead(by));
  expect((await saveSite(by, made.design.id)).status).toBe(HttpStatus.OK);
  return made.design.id;
}

/** The picture facts of a design as a reader who may read it gets them. */
export async function ticketed(caller: Caller, designId: string) {
  const reply = await tilesOf(caller, designId);
  expect(reply.status).toBe(HttpStatus.OK);
  if (reply.body.kind !== 'tiles') throw new Error('the site has no picture');
  return reply.body;
}

/** The provider the api under test asks: the memory one, which a case may make fail. */
export const sourceOf = (world: StudioWorld) =>
  world.http.app.get<SkyPictureSource>(SKY_PICTURE_SOURCE);
