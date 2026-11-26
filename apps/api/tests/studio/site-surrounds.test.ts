import { writeArrayBuffer } from 'geotiff';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  heightsOfTags,
  OverpassBuildingOutlines,
} from '../../src/modules/studio/internal/building-outline.overpass';
import { PvgisFarHorizon } from '../../src/modules/studio/internal/far-horizon.pvgis';
import { bandsOf } from '../../src/modules/studio/internal/geotiff-read';
import { answering, asked, sangli, status } from './source-support';

const OK = status.ok;
const SERVER_ERROR = status.serverError;
const SANGLI = sangli;

/**
 * Part g's other sources on answers made in the test (`T-M05-002`): a height map's GeoTIFF read
 * into its bands on its UTM grid, PVGIS's far horizon and its "over the sea", and OpenStreetMap's
 * buildings and the heights its tags give.
 */

const BAD_REQUEST = 400;
const TOO_MANY = 429;
const ZONE_43N_EPSG = 32_643;
const WGS84_EPSG = 4_326;
/** A test raster: two pixels a side, a quarter metre each, its corner in zone 43N. */
const SIDE_PX = 2;
const PIXEL_M = 0.25;
const WEST = 457_000;
const NORTH = 1_861_500;
const VALUES = Array.from({ length: SIDE_PX * SIDE_PX }, (_, i) => i + 1);
/** OpenStreetMap is asked this far round the pin. */
const REACH_M = 100;
/** Dubai, where Google holds no height map. */
const DUBAI = { latitude: 25.0657, longitude: 55.1713 };
/** A square ring closed on its first corner: three corners once it is opened. */
const OPEN_CORNERS = 3;
const TWELVE_M = 12;
const RAISED_M = 3;
const ABOVE_RAISED_M = 9.5;
const THREE_ABOVE = 3;
const TWO_ABOVE = 2;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a height map’s GeoTIFF read into its bands', () => {
  const tiff = (epsg: number) =>
    new Uint8Array(
      writeArrayBuffer(new Float32Array(VALUES), {
        width: SIDE_PX,
        height: SIDE_PX,
        ModelPixelScale: [PIXEL_M, PIXEL_M, 0],
        ModelTiepoint: [0, 0, 0, WEST, NORTH, 0],
        ProjectedCSTypeGeoKey: epsg,
        GTModelTypeGeoKey: 1,
        GTRasterTypeGeoKey: 1,
      }),
    );

  it('a UTM file: its zone, its north-west corner, its step and its values', async () => {
    const [band] = await bandsOf(tiff(ZONE_43N_EPSG));
    expect(band).toMatchObject({
      zone: { zone: 43, north: true },
      west: WEST,
      north: NORTH,
      stepEast: PIXEL_M,
      stepSouth: PIXEL_M,
      cols: SIDE_PX,
      rows: SIDE_PX,
    });
    expect(Array.from(band?.values ?? [])).toEqual(VALUES);
  });

  it('a file on any other grid is refused, never guessed', async () => {
    await expect(bandsOf(tiff(WGS84_EPSG))).rejects.toThrow(/not UTM/);
  });
});

describe('the far hills from PVGIS', () => {
  const PVGIS_PATH = '/api/v5_3/printhorizon';

  it('its bearings, from the south, as it counts them', async () => {
    answering({
      [PVGIS_PATH]: [
        {
          status: OK,
          body: {
            outputs: {
              horizon_profile: [
                { A: -90, H_hor: 29.8 },
                { A: 0, H_hor: 1.1 },
              ],
            },
          },
        },
      ],
    });
    expect(await new PvgisFarHorizon().horizonAt(SANGLI)).toEqual([
      { bearingFromSouthDeg: -90, elevationDeg: 29.8 },
      { bearingFromSouthDeg: 0, elevationDeg: 1.1 },
    ]);
    expect(asked[0]?.searchParams.get('lat')).toBe('16.8367');
  });

  it.each([
    [
      'over the sea: none to give',
      {
        status: BAD_REQUEST,
        body: { message: 'Location over the sea. Please, select another location' },
      },
      'none',
    ],
    [
      'any other refusal rejects',
      { status: BAD_REQUEST, body: { message: 'Bad longitude' } },
      'rejects',
    ],
    ['a server error rejects', { status: SERVER_ERROR }, 'rejects'],
  ])('%s', async (_, answer, outcome) => {
    answering({ [PVGIS_PATH]: [answer] });
    const asking = new PvgisFarHorizon().horizonAt(SANGLI);
    if (outcome === 'none') expect(await asking).toBeNull();
    else await expect(asking).rejects.toThrow();
  });
});

describe('OpenStreetMap’s buildings', () => {
  it.each([
    ['a height in metres', { height: String(TWELVE_M) }, TWELVE_M, null],
    [
      'a height with its unit, raised off the ground',
      { height: '12.5 m', min_height: String(RAISED_M) },
      ABOVE_RAISED_M,
      null,
    ],
    [
      'floors: four levels are three above the ground floor',
      { 'building:levels': '4' },
      null,
      THREE_ABOVE,
    ],
    ['floors with a roof level', { 'building:levels': '2', 'roof:levels': '1' }, null, TWO_ABOVE],
    ['words it cannot read', { height: 'tall', 'building:levels': 'many' }, null, null],
    ['no tags', {}, null, null],
  ])('%s', (_, tags, heightM, floorsAbove) => {
    expect(heightsOfTags(tags)).toEqual({ heightM, floorsAbove });
  });

  it('a way’s ring without its closing corner; a node or a broken ring left out', async () => {
    const ring = [
      { lat: 25.0658, lon: 55.1707 },
      { lat: 25.0658, lon: 55.1709 },
      { lat: 25.0656, lon: 55.1709 },
      { lat: 25.0658, lon: 55.1707 },
    ];
    answering({
      '/api/interpreter': [
        {
          status: OK,
          body: {
            elements: [
              { type: 'way', geometry: ring, tags: { building: 'yes', 'building:levels': '3' } },
              { type: 'node', tags: { building: 'yes' } },
              { type: 'way', geometry: ring.slice(0, 2), tags: { building: 'yes' } },
            ],
          },
        },
      ],
    });
    const found = await new OverpassBuildingOutlines(
      'https://overpass.test/api/interpreter',
    ).outlinesNear(DUBAI, REACH_M);
    expect(found).toHaveLength(1);
    expect(found[0]?.ring).toHaveLength(OPEN_CORNERS);
    expect(found[0]?.floorsAbove).toBe(2);
  });

  it('a busy server rejects', async () => {
    answering({ '/api/interpreter': [{ status: TOO_MANY }] });
    await expect(
      new OverpassBuildingOutlines('https://overpass.test/api/interpreter').outlinesNear(
        SANGLI,
        REACH_M,
      ),
    ).rejects.toThrow(/429/);
  });
});
