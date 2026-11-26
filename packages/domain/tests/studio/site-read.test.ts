import { describe, expect, it } from 'vitest';
import { coordinateOf, type GroundPoint } from '../../src/studio/ground';
import { heightAt } from '../../src/studio/site-grid';
import { rasterOnGround, siteReadOf, type UtmRaster } from '../../src/studio/site-read';
import { utmOf, utmZoneOfEpsg } from '../../src/studio/site-utm';
import { gridOf, inBox } from './site-support';

/**
 * The server's read of a height map (`T-M05-002`, part g): UTM rasters laid on the site's own
 * ground, and the datum at the pin's building's ground.
 */

const SANGLI = { latitude: 16.836668, longitude: 74.596606 };
const ZONE_43N = { zone: 43, north: true };

describe('UTM, the grid Google lays its height maps on', () => {
  it.each([
    [32_643, { zone: 43, north: true }],
    [32_601, { zone: 1, north: true }],
    [32_660, { zone: 60, north: true }],
    [32_756, { zone: 56, north: false }],
    [32_600, null],
    [32_661, null],
    [4_326, null],
  ])('EPSG %i is %o', (epsg, zone) => {
    expect(utmZoneOfEpsg(epsg)).toEqual(zone);
  });

  // Each worked out apart from this code, by Karney's Krüger series.
  it.each([
    [
      'a zone’s central meridian on the equator',
      { latitude: 0, longitude: 75 },
      ZONE_43N,
      500_000,
      0,
    ],
    ['Sangli', SANGLI, ZONE_43N, 457_024.12, 1_861_530.4],
    [
      'Sydney: south of the equator the northing counts from 10,000 km',
      { latitude: -33.8688, longitude: 151.2093 },
      { zone: 56, north: false },
      334_368.63,
      6_250_948.35,
    ],
  ])('%s', (_, place, zone, easting, northing) => {
    const utm = utmOf(place, zone);
    expect(utm.easting).toBeCloseTo(easting, 1);
    expect(utm.northing).toBeCloseTo(northing, 1);
  });
});

/** A raster on the UTM grid round the pin, `heightOf` read at each pixel's ground. */
function rasterRound(
  pin: { latitude: number; longitude: number },
  size: number,
  step: number,
  heightOf: (p: GroundPoint) => number,
  zone = ZONE_43N,
): UtmRaster {
  const middle = utmOf(pin, zone);
  const cols = Math.round(size / step);
  const west = Math.round(middle.easting - size / 2);
  const north = Math.round(middle.northing + size / 2);
  const values = new Float32Array(cols * cols);
  // A pixel's ground: its UTM middle back on the globe, by a fine search of the forward map.
  const toGround = (easting: number, northing: number): GroundPoint => {
    let guess = { east: easting - middle.easting, north: northing - middle.northing };
    for (let i = 0; i < 4; i += 1) {
      const at = utmOf(coordinateOf(pin, guess), zone);
      guess = {
        east: guess.east - (at.easting - easting),
        north: guess.north - (at.northing - northing),
      };
    }
    return guess;
  };
  for (let row = 0; row < cols; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      values[row * cols + col] = heightOf(
        toGround(west + (col + 0.5) * step, north - (row + 0.5) * step),
      );
    }
  }
  return {
    zone,
    west,
    north,
    stepEast: step,
    stepSouth: step,
    cols,
    rows: cols,
    values,
    noData: -9999,
  };
}

describe('a raster read onto the site’s ground', () => {
  it('a wall a zone’s turn off grid north lands where it stands, not where the grid says', () => {
    // Far from zone 43's central meridian (75° E) the grid turns 2.6° off true north.
    const pin = { latitude: 30, longitude: 77.9 };
    const wall = (p: GroundPoint) => (p.east >= 20 ? 10 : 0);
    const raster = rasterRound(pin, 100, 0.25, wall);
    const ground = rasterOnGround(
      raster,
      pin,
      { west: -40, east: 40, south: -40, north: 40 },
      0.25,
      false,
    );
    // At 35 m north a 2.6° turn would move the wall 1.6 m east.
    expect(heightAt(ground, { east: 19.7, north: 35 })).toBe(0);
    expect(heightAt(ground, { east: 20.3, north: 35 })).toBe(10);
  });

  it('a pixel with no data stays without', () => {
    const raster = rasterRound(SANGLI, 40, 0.5, (p) => (p.east > 0 ? -9999 : 3));
    const ground = rasterOnGround(
      raster,
      SANGLI,
      { west: -10, east: 10, south: -10, north: 10 },
      0.5,
      true,
    );
    expect(heightAt(ground, { east: 5, north: 0 })).toBeNaN();
    expect(heightAt(ground, { east: -5, north: 0 })).toBe(3);
  });
});

describe('the height map read into site data', () => {
  const house = inBox(-6, -5, 6, 5);
  const neighbour = inBox(15, -5, 25, 5);
  const heightOf = (p: GroundPoint) => 560 + (house(p) ? 9.1 : neighbour(p) ? 6 : 0);
  const read = () =>
    siteReadOf({
      pin: SANGLI,
      dsm: rasterRound(SANGLI, 100, 0.25, heightOf),
      mask: rasterRound(SANGLI, 100, 0.25, (p) => (house(p) || neighbour(p) ? 1 : 0)),
      rgb: null,
      near: { west: -10, east: 10, south: -10, north: 10 },
    });

  it('the datum is the ground of the pin’s building, so heights read above it', () => {
    const site = read();
    expect(site?.datumM).toBeCloseTo(560, 1);
    expect(heightAt(site?.near ?? gridOf(1, 1, () => 0), { east: 0, north: 0 })).toBeCloseTo(
      9.1,
      1,
    );
  });

  it('each building is traced, squared and stands on its ground', () => {
    const site = read();
    expect(site?.buildings).toHaveLength(2);
    for (const building of site?.buildings ?? []) {
      expect(building.outline).toHaveLength(4);
      expect(building.groundM).toBeCloseTo(0, 1);
    }
  });

  it('the eaves are the walls where the roof falls to the ground', () => {
    expect(read()?.eaves.length).toBe(8);
  });

  it('the near heights cover the box asked for; the around ones the whole map, a metre a cell', () => {
    const site = read();
    const near = site?.near;
    expect(near?.stepM).toBe(0.25);
    expect(near?.west ?? 0).toBeLessThanOrEqual(-10);
    expect((near?.west ?? 0) + (near?.cols ?? 0) * 0.25).toBeGreaterThanOrEqual(10);
    expect(near?.cols ?? 0).toBeLessThanOrEqual(81);
    expect(site?.around.stepM).toBe(1);
  });

  it('a height map with no data round the pin reads nothing', () => {
    expect(
      siteReadOf({
        pin: SANGLI,
        dsm: rasterRound(SANGLI, 40, 0.5, () => -9999),
        mask: rasterRound(SANGLI, 40, 0.5, () => 0),
        rgb: null,
        near: { west: -10, east: 10, south: -10, north: 10 },
      }),
    ).toBeNull();
  });
});
