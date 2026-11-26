import type { Billed, BuildingAnswer, HeightMapAnswer, RoofDataPort } from '@heliogrid/contracts';
import { type Coordinate, coordinateOf, type GroundPoint } from '@heliogrid/domain';
import { utmOf } from '@heliogrid/domain/studio-kernel';
import { writeArrayBuffer } from 'geotiff';
import { uncoveredLatitude } from './sky-picture-source.memory';

/** A latitude no test site uses: a pin here is a place whose height service does not answer. */
export const unansweredLatitude = -89.4;

/** A longitude no other test site uses: Google holds its sharpest data, from the air, here. */
export const sharpestLongitude = 11.58;

/** Whether a call's middle — snapped to its grid — was asked for at a test's latitude. */
export const atLatitude = (point: Coordinate, latitude: number) =>
  Math.abs(point.latitude - latitude) < HUNDREDTH;
const HUNDREDTH = 0.01;
/** The forward map's error walked off this many times lands within a millimetre. */
const WALKS = 4;
const MIDDLE = 0.5;
/** The test picture's grey: a bright roof, a duller neighbour, darker ground. */
const GREY = { roof: 220, neighbour: 160, ground: 70 } as const;

/** The test site: its ground above the sea, its house's deck above that, and its neighbour's. */
export const memorySite = { groundM: 560, deckM: 9.1, neighbourM: 6 } as const;
const HOUSE = { west: -6, south: -5, east: 6, north: 5 };
const NEIGHBOUR = { west: 15, south: -5, east: 25, north: 5 };
const PIXEL_M = 0.5;
const ZONE_DEGREES = 6;
const HALF_TURN = 180;
const EPSG_NORTH = 32_600;
const EPSG_SOUTH = 32_700;

/** The UTM zone a place lies in, as Google lays each height map on its own place's zone. */
const zoneOf = (point: Coordinate) => ({
  zone: Math.floor((point.longitude + HALF_TURN) / ZONE_DEGREES) + 1,
  north: point.latitude >= 0,
});

/** The test map reaches this far at most, so a suite reads it fast. */
const REACH_M = 40;
const RGB = 3;

const inside = (box: typeof HOUSE, p: GroundPoint) =>
  p.east >= box.west && p.east <= box.east && p.north >= box.south && p.north <= box.north;

/** A UTM point back on the pin's ground: the forward map's error walked off, four times. */
function groundAt(pin: Coordinate, easting: number, northing: number): GroundPoint {
  const zone = zoneOf(pin);
  const middle = utmOf(pin, zone);
  let guess = { east: easting - middle.easting, north: northing - middle.northing };
  for (let i = 0; i < WALKS; i += 1) {
    const at = utmOf(coordinateOf(pin, guess), zone);
    guess = {
      east: guess.east - (at.easting - easting),
      north: guess.north - (at.northing - northing),
    };
  }
  return guess;
}

/** One band (or three, chunky) as a GeoTIFF on the pin's own UTM zone round the pin. */
function tiffOf(
  pin: Coordinate,
  radiusM: number,
  bands: number,
  bandAt: (p: GroundPoint, band: number) => number,
  kind: 'float' | 'byte',
): Uint8Array {
  const zone = zoneOf(pin);
  const middle = utmOf(pin, zone);
  const side = Math.round((2 * radiusM) / PIXEL_M);
  const west = Math.round(middle.easting - radiusM);
  const north = Math.round(middle.northing + radiusM);
  const values =
    kind === 'float' ? new Float32Array(side * side * bands) : new Uint8Array(side * side * bands);
  for (let row = 0; row < side; row += 1) {
    for (let col = 0; col < side; col += 1) {
      const p = groundAt(pin, west + (col + MIDDLE) * PIXEL_M, north - (row + MIDDLE) * PIXEL_M);
      for (let band = 0; band < bands; band += 1) {
        values[(row * side + col) * bands + band] = bandAt(p, band);
      }
    }
  }
  const tiff = writeArrayBuffer(values, {
    width: side,
    height: side,
    ModelPixelScale: [PIXEL_M, PIXEL_M, 0],
    ModelTiepoint: [0, 0, 0, west, north, 0],
    ProjectedCSTypeGeoKey: (zone.north ? EPSG_NORTH : EPSG_SOUTH) + zone.zone,
    GTModelTypeGeoKey: 1,
    GTRasterTypeGeoKey: 1,
  });
  return new Uint8Array(tiff);
}

/**
 * The test suites' height service: a suite never reaches a third party. Every pin has one house —
 * 12 × 10 m, its deck 9.1 m up — and a 6 m neighbour 15 m to its east, on level ground 560 m above
 * the sea; a pin at `uncoveredLatitude` is a place the service holds nothing of, and one at
 * `unansweredLatitude` a service that does not answer. `asked` counts the calls a suite made.
 */
export class MemoryRoofData implements RoofDataPort {
  readonly setUp = true;
  asked = 0;

  private check(point: Coordinate): boolean {
    this.asked += 1;
    if (atLatitude(point, unansweredLatitude)) {
      throw new Error('the memory height service does not answer here');
    }
    return !atLatitude(point, uncoveredLatitude);
  }

  async buildingAt(point: Coordinate, billed: Billed): Promise<BuildingAnswer | null> {
    if (!this.check(point)) return null;
    billed();
    return {
      quality: Math.abs(point.longitude - sharpestLongitude) < HUNDREDTH ? 'high' : 'base',
      dataOn: '2025-10-17',
      middle: point,
      faces: [
        {
          middle: point,
          slopeDeg: 1,
          facingDeg: 180,
          areaM2: 120,
          heightAboveSeaM: memorySite.groundM + memorySite.deckM,
        },
      ],
      reply: { name: 'buildings/memory' },
    };
  }

  async heightMapAt(
    point: Coordinate,
    radiusM: number,
    _sharpest: boolean,
    billed: Billed,
  ): Promise<HeightMapAnswer | null> {
    if (!this.check(point)) return null;
    billed();
    const heightOf = (p: GroundPoint) =>
      memorySite.groundM +
      (inside(HOUSE, p) ? memorySite.deckM : inside(NEIGHBOUR, p) ? memorySite.neighbourM : 0);
    const reach = Math.min(radiusM, REACH_M);
    return {
      quality: 'base',
      dataOn: '2025-10-17',
      surface: tiffOf(point, reach, 1, heightOf, 'float'),
      buildings: tiffOf(
        point,
        reach,
        1,
        (p) => (inside(HOUSE, p) || inside(NEIGHBOUR, p) ? 1 : 0),
        'byte',
      ),
      picture: tiffOf(
        point,
        reach,
        RGB,
        (p) => (inside(HOUSE, p) ? GREY.roof : inside(NEIGHBOUR, p) ? GREY.neighbour : GREY.ground),
        'byte',
      ),
    };
  }
}
