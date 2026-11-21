import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import {
  SKY_TILES_PER_VIEW_MAX,
  skyRealDetailMetres,
  skyTileGround,
  skyTilePixelMetres,
  skyTileReach,
  skyTilesInView,
  skyTileZoom,
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
const roofAt = (east: number, north: number): Roof => ({
  id: '00000000-0000-4000-8000-000000000001',
  corners: [
    { east, north },
    { east: east + 10, north },
    { east: east + 10, north: north + 8 },
  ],
  edges: ['traced', 'traced', 'traced'],
  tracedOn: 'sky',
});

describe('the ground a tile pixel covers', () => {
  it('halves with each zoom and shrinks with the latitude', () => {
    // Zoom 19 at the equator: 40,075,016.686 m / 2^19 / 512 px.
    expect(skyTilePixelMetres(0, 19)).toBeCloseTo(0.149_29, 4);
    expect(skyTilePixelMetres(0, 20)).toBeCloseTo(skyTilePixelMetres(0, 19) / 2, 9);
    expect(skyTilePixelMetres(60, 19)).toBeCloseTo(skyTilePixelMetres(0, 19) / 2, 6);
  });

  it('the real detail is the provider’s own pixel at its finest zoom: two tile pixels', () => {
    expect(skyRealDetailMetres(PUNE.latitude, 19)).toBeCloseTo(0.283, 3);
    expect(skyRealDetailMetres(PUNE.latitude, 19)).toBeCloseTo(
      2 * skyTilePixelMetres(PUNE.latitude, 19),
      9,
    );
  });
});

describe('the zoom a view asks for', () => {
  it.each([
    // metres a device pixel, latitude → the coarsest zoom whose pixel is no bigger
    ['the equator, a pixel exactly a zoom 19 pixel', skyTilePixelMetres(0, 19), 0, 19],
    ['the equator, a hair finer than a zoom 19 pixel', 0.149, 0, 20],
    ['the equator, a hair finer than a zoom 18 pixel', 0.298, 0, 19],
    ['the equator, a hair coarser than a zoom 18 pixel', 0.299, 0, 18],
    ['60°, where every pixel covers half the ground', 0.1495, 60, 18],
    ['60°, a hair coarser than a zoom 19 pixel there', 0.075, 60, 19],
  ])('%s', (_what, perPixel, latitude, zoom) => {
    expect(skyTileZoom(perPixel, latitude, { zoomMin: 10, zoomMax: 22 })).toBe(zoom);
  });

  it('never passes the cap, however near the camera comes', () => {
    expect(skyTileZoom(0.001, PUNE.latitude, INDIA)).toBe(19);
  });

  it('never goes below the coarsest zoom, however far the camera stands', () => {
    expect(skyTileZoom(50, PUNE.latitude, INDIA)).toBe(16);
  });

  it.each([0, -1, Number.NaN])(
    'a reading of %s is the camera at its nearest: the cap',
    (perPixel) => {
      expect(skyTileZoom(perPixel, PUNE.latitude, INDIA)).toBe(19);
    },
  );
});

describe('the ground the picture may be fetched for', () => {
  it('a roof site with no roof yet: 300 m round the pin', () => {
    expect(skyTileReach('roof', { roofs: [], pictureScale: 1, land: null })).toEqual(box(300));
  });

  it('grows to hold every roof, 300 m round it', () => {
    const reach = skyTileReach('roof', {
      roofs: [roofAt(20, 10), roofAt(-40, -30)],
      pictureScale: 1,
      land: null,
    });
    expect(reach).toEqual({ west: -340, east: 330, south: -330, north: 318 });
  });

  it('a roof past 300 m from the pin is still inside', () => {
    const reach = skyTileReach('roof', { roofs: [roofAt(900, 0)], pictureScale: 1, land: null });
    expect(reach.east).toBe(1_210);
    expect(reach.west).toBe(-300);
  });

  it('reads a roof where it lies on the picture: its ground less the picture’s stretch', () => {
    const reach = skyTileReach('roof', { roofs: [roofAt(100, 0)], pictureScale: 2, land: null });
    // The roof's far corner, 110 m east on the ground, is 55 m east on the picture.
    expect(reach.east).toBe(355);
  });

  it('a ground mount: the land and 100 m round it', () => {
    const land = { west: -80, east: 400, south: -50, north: 220 };
    expect(skyTileReach('ground', { roofs: [], pictureScale: 1, land })).toEqual({
      west: -180,
      east: 500,
      south: -150,
      north: 320,
    });
  });

  it('a ground mount whose land is not drawn yet: as a roof’s, round the pin', () => {
    expect(skyTileReach('ground', { roofs: [], pictureScale: 1, land: null })).toEqual(box(300));
  });
});

describe('the coarsest zoom', () => {
  it('is the finest at which the reach is at most two tiles across', () => {
    // 600 m across in Pune: a zoom 16 tile is 580 m, a zoom 17 tile 290 m.
    expect(skyTileZoomMin(PUNE.latitude, box(300), 19)).toBe(16);
    expect(skyTileZoomMin(PUNE.latitude, box(1_200), 19)).toBe(14);
  });

  it('never passes the cap', () => {
    expect(skyTileZoomMin(PUNE.latitude, box(10), 19)).toBe(19);
  });
});

describe('where a tile lies', () => {
  it('on the site’s ground, north up, as the tile grid cuts it', () => {
    const [key] = skyTilesInView(PUNE, box(1), box(300), 19, 16).tiles;
    expect(key).toBeDefined();
    if (key === undefined) return;
    const ground = skyTileGround(PUNE, key);
    expect(ground.west).toBeLessThanOrEqual(0);
    expect(ground.east).toBeGreaterThan(0);
    expect(ground.south).toBeLessThanOrEqual(0);
    expect(ground.north).toBeGreaterThan(0);
    // One zoom 19 tile in Pune: 40,075,016.686 m × cos(18.5204°) / 2^19.
    expect(ground.east - ground.west).toBeCloseTo(72.48, 1);
    expect(ground.north - ground.south).toBeCloseTo(72.48, 0);
  });

  it('a tile across the date line lies beside the pin, not a world away', () => {
    const { tiles } = skyTilesInView(DATE_LINE, box(150), box(300), 18, 16);
    const wide = tiles.map((key) => skyTileGround(DATE_LINE, key));
    expect(Math.min(...wide.map((tile) => tile.west))).toBeLessThanOrEqual(-150);
    expect(Math.max(...wide.map((tile) => tile.east))).toBeGreaterThanOrEqual(150);
    expect(Math.max(...wide.map((tile) => Math.abs(tile.west)))).toBeLessThan(600);
    // East of the line the columns start again at 0.
    expect(new Set(tiles.map((key) => key.x)).has(0)).toBe(true);
  });
});

describe('the tiles a view needs', () => {
  it('covers the view, whole', () => {
    const seen = box(60, 20, -10);
    const { zoom, tiles } = skyTilesInView(PUNE, seen, box(300), 19, 16);
    expect(zoom).toBe(19);
    const grounds = tiles.map((key) => skyTileGround(PUNE, key));
    expect(Math.min(...grounds.map((tile) => tile.west))).toBeLessThanOrEqual(seen.west);
    expect(Math.max(...grounds.map((tile) => tile.east))).toBeGreaterThanOrEqual(seen.east);
    expect(Math.min(...grounds.map((tile) => tile.south))).toBeLessThanOrEqual(seen.south);
    expect(Math.max(...grounds.map((tile) => tile.north))).toBeGreaterThanOrEqual(seen.north);
    // 120 m of view over 72 m tiles: two or three a side.
    expect(tiles.length).toBeGreaterThanOrEqual(4);
    expect(tiles.length).toBeLessThanOrEqual(9);
    expect(new Set(tiles.map((key) => `${key.z}/${key.x}/${key.y}`)).size).toBe(tiles.length);
  });

  it('asks nearest the middle of the view first', () => {
    const { tiles } = skyTilesInView(PUNE, box(150), box(300), 19, 16);
    const far = tiles.map((key) => {
      const ground = skyTileGround(PUNE, key);
      return Math.hypot((ground.west + ground.east) / 2, (ground.south + ground.north) / 2);
    });
    expect(far).toEqual([...far].sort((a, b) => a - b));
  });

  it('never asks past the reach', () => {
    const { tiles } = skyTilesInView(PUNE, box(5_000), box(300), 19, 16);
    for (const key of tiles) {
      const ground = skyTileGround(PUNE, key);
      expect(ground.east).toBeGreaterThan(-300);
      expect(ground.west).toBeLessThan(300);
      expect(ground.north).toBeGreaterThan(-300);
      expect(ground.south).toBeLessThan(300);
    }
  });

  it('a view wholly past the reach asks for nothing', () => {
    expect(skyTilesInView(PUNE, box(50, 2_000, 0), box(300), 19, 16).tiles).toEqual([]);
  });

  it('a view of too many tiles drops a zoom rather than cut the picture', () => {
    // The whole reach at zoom 19 is nine tiles a side: zoom 18 is five, zoom 17 three.
    const seen = box(300);
    const { zoom, tiles } = skyTilesInView(PUNE, seen, box(300), 19, 16);
    expect(zoom).toBeLessThan(19);
    expect(tiles.length).toBeLessThanOrEqual(SKY_TILES_PER_VIEW_MAX);
    const grounds = tiles.map((key) => skyTileGround(PUNE, key));
    expect(Math.min(...grounds.map((tile) => tile.west))).toBeLessThanOrEqual(seen.west);
    expect(Math.max(...grounds.map((tile) => tile.east))).toBeGreaterThanOrEqual(seen.east);
  });

  it('at the coarsest zoom the picture is whole, whatever the count', () => {
    const { zoom, tiles } = skyTilesInView(PUNE, box(300), box(300), 16, 16);
    expect(zoom).toBe(16);
    expect(tiles.length).toBeGreaterThanOrEqual(1);
    expect(tiles.length).toBeLessThanOrEqual(9);
  });

  it.each([
    ['the equator', EQUATOR],
    ['60° north', OSLO],
    ['the date line', DATE_LINE],
  ])('%s: the pin is under a tile of the view', (_where, pin) => {
    const { tiles } = skyTilesInView(pin, box(30), box(300), 19, 16);
    const under = tiles.filter((key) => {
      const ground = skyTileGround(pin, key);
      return ground.west <= 0 && ground.east > 0 && ground.south <= 0 && ground.north > 0;
    });
    expect(under).toHaveLength(1);
  });
});
