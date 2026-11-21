import { describe, expect, it } from 'vitest';
import { groundOf } from '../../src/studio/ground';
import {
  SKY_TILES_PER_OPENING_MAX,
  SKY_TILES_PER_VIEW_MAX,
  skyTileAllowed,
  skyTileGround,
  skyTileRange,
  skyTileReach,
  skyTilesInView,
  skyTileZoomMin,
} from '../../src/studio/sky-tiles';

const PUNE = { latitude: 18.5204, longitude: 73.8567 };
const EQUATOR = { latitude: 0, longitude: 10 };
const OSLO = { latitude: 60, longitude: 10.75 };
/** Taveuni, Fiji: the date line runs through the site. */
const DATE_LINE = { latitude: -16.8, longitude: 179.9995 };
const INDIA = { zoomMin: 16, zoomMax: 19 };

const box = (half: number, east = 0, north = 0) => ({
  west: east - half,
  east: east + half,
  south: north - half,
  north: north + half,
});

describe('the tiles a design opens on', () => {
  /** The first picture's tiles and the first view's: what an opening asks for. */
  const opening = (pin: { latitude: number; longitude: number }, seen: ReturnType<typeof box>) => {
    const reach = skyTileReach('roof', { roofs: [], pictureScale: 1, land: null });
    const zoomMin = skyTileZoomMin(pin.latitude, reach, 19);
    const first = skyTilesInView(pin, reach, reach, zoomMin, zoomMin).tiles;
    const view = skyTilesInView(pin, seen, reach, 19, zoomMin).tiles;
    return { first, view };
  };

  it.each([
    ['Pune, a desktop’s first view', PUNE, box(72)],
    ['Pune, the whole reach in view', PUNE, box(300)],
    ['the equator, the whole reach', EQUATOR, box(300)],
    ['60° north, where tiles are half as wide', OSLO, box(300)],
    ['the date line', DATE_LINE, box(300)],
  ])(
    '%s: never more than the opening allows, the first picture at most nine',
    (_where, pin, seen) => {
      const { first, view } = opening(pin, seen);
      expect(first.length).toBeGreaterThanOrEqual(1);
      expect(first.length).toBeLessThanOrEqual(9);
      expect(view.length).toBeLessThanOrEqual(SKY_TILES_PER_VIEW_MAX);
      expect(first.length + view.length).toBeLessThanOrEqual(SKY_TILES_PER_OPENING_MAX);
    },
  );

  it('every site the tile grid can cut the reach for stays inside the opening', () => {
    // The pin walked across a whole coarse tile, corner to corner: the worst cut lies on the way.
    let most = 0;
    for (let step = 0; step <= 40; step += 1) {
      const pin = { latitude: 18.5 + step * 0.000_15, longitude: 73.85 + step * 0.000_15 };
      const { first, view } = opening(pin, box(300));
      most = Math.max(most, first.length + view.length);
    }
    expect(most).toBeLessThanOrEqual(SKY_TILES_PER_OPENING_MAX);
    expect(most).toBeGreaterThan(0);
  });
});

describe('the tiles a ticket lets through', () => {
  const reach = box(300);
  const range = skyTileRange(PUNE, reach, 19);

  it('every tile a view inside the reach needs, at every zoom', () => {
    for (const zoom of [16, 17, 18, 19]) {
      for (const key of skyTilesInView(PUNE, box(300), reach, zoom, 16).tiles) {
        expect(skyTileAllowed(key, range, INDIA)).toBe(true);
      }
    }
  });

  it('not a tile past the reach', () => {
    const [inside] = skyTilesInView(PUNE, box(1), reach, 19, 16).tiles;
    if (inside === undefined) throw new Error('no tile under the pin');
    // Ten tiles east: 725 m from the pin.
    expect(skyTileAllowed({ ...inside, x: inside.x + 10 }, range, INDIA)).toBe(false);
    expect(skyTileAllowed({ ...inside, y: inside.y - 10 }, range, INDIA)).toBe(false);
  });

  it('not a zoom above the cap or below the coarsest', () => {
    const [inside] = skyTilesInView(PUNE, box(1), reach, 19, 16).tiles;
    if (inside === undefined) throw new Error('no tile under the pin');
    expect(skyTileAllowed({ z: 20, x: inside.x * 2, y: inside.y * 2 }, range, INDIA)).toBe(false);
    expect(skyTileAllowed({ z: 15, x: inside.x >> 4, y: inside.y >> 4 }, range, INDIA)).toBe(false);
  });

  it.each([
    ['a part of a tile', { z: 19, x: 1.5, y: 2 }],
    ['a column left of the grid', { z: 19, x: -1, y: 2 }],
    ['a row past the grid', { z: 19, x: 1, y: 2 ** 19 }],
  ])('not %s', (_what, key) => {
    expect(skyTileAllowed(key, range, INDIA)).toBe(false);
  });

  it('across the date line, the tiles on both sides', () => {
    const lineRange = skyTileRange(DATE_LINE, reach, 18);
    const zooms = { zoomMin: 16, zoomMax: 18 };
    for (const key of skyTilesInView(DATE_LINE, box(300), reach, 18, 16).tiles) {
      expect(skyTileAllowed(key, lineRange, zooms)).toBe(true);
    }
  });

  it('the tile grid and the ground agree on where the pin is', () => {
    const [key] = skyTilesInView(OSLO, box(1), reach, 19, 16).tiles;
    if (key === undefined) throw new Error('no tile under the pin');
    const ground = skyTileGround(OSLO, key);
    const corner = groundOf(OSLO, OSLO);
    expect(ground.west).toBeLessThanOrEqual(corner.east);
    expect(ground.east).toBeGreaterThan(corner.east);
  });
});
