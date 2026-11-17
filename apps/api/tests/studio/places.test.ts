import { randomUUID } from 'node:crypto';
import type { PlaceAnswer, PlaceSuggestions } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PLACE_SOURCE } from '../../src/modules/studio/internal/place-source';
import type { MemoryPlaceSource } from '../../src/modules/studio/internal/place-source.memory';
import { skipWithoutDatabase } from '../support/fixture';
import { aStaffedCompany, openStudioWorld, preset, type StudioWorld } from './support';

/**
 * The place search of Site details on the wire (`T-M05-001a`): a found place is read as the
 * company's market reads it, a map service that is down is answered as "not available" — never as
 * an error — and the search is the design grant's alone.
 */

const here = aStaffedCompany('Place Search EPC', {
  owner: [FOUNDER_ROLE],
  seller: [preset.sales_executive],
  accounts: [preset.finance],
});

/** A point a few metres from the memory source's Panaji, one in open country, Sangli's, and one off the globe. */
const NEAR_PANAJI = { latitude: 15.4912, longitude: 73.8281 };
const OPEN_COUNTRY = { latitude: 21.5, longitude: 78.5 };
const SANGLI = { latitude: 16.8367, longitude: 74.5966 };
const OFF_THE_GLOBE = { latitude: 95, longitude: 74 };

const skip = skipWithoutDatabase(
  'PLACE SEARCH PROOF',
  'How a found place is read, and what a search that is down answers, is UNPROVEN in this run.',
);

describe.skipIf(skip)('The place search, over HTTP against a migrated database', () => {
  let world: StudioWorld;
  const session = randomUUID();
  const seller = () => world.as(here.members.seller);
  const source = () => world.http.app.get<MemoryPlaceSource>(PLACE_SOURCE);
  const suggest = (query: string) =>
    seller().call<PlaceSuggestions>(
      'GET',
      `/places/suggestions?query=${encodeURIComponent(query)}&session=${session}`,
    );
  const details = (placeId: string) =>
    seller().call<PlaceAnswer>('GET', `/places/details?placeId=${placeId}&session=${session}`);
  const placeAt = (point: { latitude: number; longitude: number }) =>
    seller().call<PlaceAnswer>(
      'GET',
      `/places/at?latitude=${point.latitude}&longitude=${point.longitude}`,
    );

  beforeAll(async () => {
    world = await openStudioWorld([here]);
  });

  afterEach(() => {
    source().goDown(false);
  });

  afterAll(async () => {
    await world.close();
  });

  it('suggests the places that match what was typed', async () => {
    const reply = await suggest('vishrambag');
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({
      available: true,
      suggestions: [
        {
          placeId: 'memory-sangli',
          title: 'Swapnanagri, Vishrambag',
          line: 'Sangli, Maharashtra 416415',
        },
      ],
    });
    expect((await suggest('nowhere at all')).body).toEqual({ available: true, suggestions: [] });
  });

  it('reads a suggested place as the market does: its area by the pack’s code, inside the market', async () => {
    const reply = await details('memory-sangli');
    expect(reply.body).toEqual({
      available: true,
      place: {
        address: 'Swapnanagri, Vishrambag, Sangli, Maharashtra 416415',
        pin: SANGLI,
        area: 'IN-MH',
        inMarket: true,
      },
    });
  });

  it('says a place in another country is outside the market, and gives it no area', async () => {
    const reply = await details('memory-munich');
    expect(reply.body.place).toMatchObject({ area: null, inMarket: false });
  });

  it('reads the place at a typed point, and answers no place where it knows none', async () => {
    const near = await placeAt(NEAR_PANAJI);
    expect(near.body).toEqual({
      available: true,
      place: {
        address: 'Altinho, Panaji, Goa 403001',
        pin: NEAR_PANAJI,
        area: 'IN-GA',
        inMarket: true,
      },
    });
    expect((await placeAt(OPEN_COUNTRY)).body).toEqual({ available: true, place: null });
    expect((await details('memory-unknown')).body).toEqual({ available: true, place: null });
  });

  it('answers "not available" on every route while the map service is down', async () => {
    source().goDown(true);
    expect((await suggest('vishrambag')).body).toEqual({ available: false, suggestions: [] });
    expect((await details('memory-sangli')).body).toEqual({ available: false, place: null });
    const at = await placeAt(SANGLI);
    expect(at.status).toBe(HttpStatus.OK);
    expect(at.body).toEqual({ available: false, place: null });
  });

  it('refuses a search of fewer than three letters and a point off the globe, each by its field', async () => {
    expect((await suggest('vi')).status).toBe(HttpStatus.BAD_REQUEST);
    expect((await placeAt(OFF_THE_GLOBE)).status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('is the design grant’s alone', async () => {
    const finance = world.as(here.members.accounts);
    const paths = [
      `/places/suggestions?query=vishrambag&session=${session}`,
      `/places/details?placeId=memory-sangli&session=${session}`,
      '/places/at?latitude=16.8367&longitude=74.5966',
    ];
    for (const path of paths) {
      expect([path, (await finance.call('GET', path)).status]).toEqual([
        path,
        HttpStatus.FORBIDDEN,
      ]);
    }
  });
});
