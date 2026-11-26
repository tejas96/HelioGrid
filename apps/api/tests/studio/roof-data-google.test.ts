import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleRoofData } from '../../src/modules/studio/internal/roof-data.google';
import { type Answer, answering, asked, sangli, status } from './source-support';

const OK = status.ok;
const SERVER_ERROR = status.serverError;
const SANGLI = sangli;

/**
 * Google's Solar API on answers made in the test (`T-M05-002`, part g; no Google data is kept in
 * the repo): asked at BASE and once more with the wider coverage after a not-found, its GeoTIFF
 * links fetched with the key and asked afresh once when they ran out, and the key never in an error.
 */

const FORBIDDEN = 403;
const NOT_FOUND = 404;
const KEY = 'server-key';
const BUILDING_PATH = '/v1/buildingInsights:findClosest';
const LAYERS_PATH = '/v1/dataLayers:get';
const FILES_PATH = '/v1/geoTiff:get';
const FILE_HOST = `https://solar.googleapis.com${FILES_PATH}`;
/** Each file's one byte, so which came where can be read. */
const SURFACE = 1;
const MASK = 2;
const PICTURE = 3;
/** A radius Google is asked for in whole metres. */
const RADIUS_M = 49.6;
const RADIUS_ASKED = '50';
const AGAIN = 2;

/** A count of the calls Google bills, as the adapter reports them. */
function billCounter() {
  const bill = { calls: 0 };
  return {
    bill,
    billed: () => {
      bill.calls += 1;
    },
  };
}
const CALL_M = 50;

afterEach(() => {
  vi.unstubAllGlobals();
});

const building = {
  name: 'buildings/x',
  center: SANGLI,
  imageryDate: { year: 2025, month: 10, day: 7 },
  imageryQuality: 'BASE',
  solarPotential: {
    roofSegmentStats: [
      {
        pitchDegrees: 6.2,
        azimuthDegrees: -270,
        stats: { areaMeters2: 41.5 },
        center: SANGLI,
        planeHeightAtCenterMeters: 566.3,
      },
    ],
    solarPanels: [{ center: SANGLI }],
  },
};

const layers = {
  imageryDate: { year: 2025, month: 10, day: 7 },
  imageryQuality: 'HIGH',
  dsmUrl: `${FILE_HOST}?id=dsm`,
  maskUrl: `${FILE_HOST}?id=mask`,
  rgbUrl: `${FILE_HOST}?id=rgb`,
};

describe('Google’s Solar API on the server key', () => {
  it('a building: asked at BASE, its faces, sharpness and date read, its whole reply kept', async () => {
    answering({ [BUILDING_PATH]: [{ status: OK, body: building }] });
    const { bill, billed } = billCounter();
    const answer = await new GoogleRoofData(KEY).buildingAt(SANGLI, billed);
    expect(bill.calls).toBe(1);
    expect(asked).toHaveLength(1);
    expect(asked[0]?.searchParams.get('requiredQuality')).toBe('BASE');
    expect(asked[0]?.searchParams.has('experiments')).toBe(false);
    expect(asked[0]?.searchParams.get('key')).toBe(KEY);
    expect(answer).toMatchObject({ quality: 'base', dataOn: '2025-10-07', middle: SANGLI });
    expect(answer?.faces).toEqual([
      { middle: SANGLI, slopeDeg: 6.2, facingDeg: 90, areaM2: 41.5, heightAboveSeaM: 566.3 },
    ]);
    expect(answer?.reply).toEqual(building);
  });

  it.each([
    ['found at once: one ask, billed', [{ status: OK, body: building }], 1, true],
    [
      'not found, then found with the wider coverage: two asks, the found one billed',
      [{ status: NOT_FOUND }, { status: OK, body: building }],
      2,
      true,
    ],
    [
      'not found either way: nothing, two asks, none billed',
      [{ status: NOT_FOUND }, { status: NOT_FOUND }],
      2,
      false,
    ],
  ])('%s', async (_, answers, asks, found) => {
    answering({ [BUILDING_PATH]: answers });
    const { bill, billed } = billCounter();
    const answer = await new GoogleRoofData(KEY).buildingAt(SANGLI, billed);
    expect(asked).toHaveLength(asks);
    expect(answer !== null).toBe(found);
    expect(bill.calls).toBe(found ? 1 : 0);
    if (asks === AGAIN) expect(asked[1]?.searchParams.get('experiments')).toBe('EXPANDED_COVERAGE');
  });

  it.each([
    ['a word Google adds later', 'LOW'],
    ['an unspecified one', 'IMAGERY_QUALITY_UNSPECIFIED'],
  ])('%s for its sharpness reads as its lowest, BASE', async (_, word) => {
    answering({ [BUILDING_PATH]: [{ status: OK, body: { ...building, imageryQuality: word } }] });
    const answer = await new GoogleRoofData(KEY).buildingAt(SANGLI, billCounter().billed);
    expect(answer?.quality).toBe('base');
  });

  it('a billed answer that cannot be read rejects, and is still counted', async () => {
    answering({ [BUILDING_PATH]: [{ status: OK, body: { name: 'buildings/x' } }] });
    const { bill, billed } = billCounter();
    await expect(new GoogleRoofData(KEY).buildingAt(SANGLI, billed)).rejects.toThrow();
    expect(bill.calls).toBe(1);
  });

  it.each([['a server error', { status: SERVER_ERROR }]])(
    '%s rejects, unbilled, and the error never carries the key',
    async (_, answer) => {
      answering({ [BUILDING_PATH]: [answer] });
      const { bill, billed } = billCounter();
      const asking = new GoogleRoofData(KEY).buildingAt(SANGLI, billed);
      await asking.catch(() => undefined);
      expect(bill.calls).toBe(0);
      await expect(asking).rejects.toThrow();
      await asking.catch((error: Error) => expect(error.message).not.toContain(KEY));
    },
  );

  const files = (): Record<string, Answer[]> => ({
    [LAYERS_PATH]: [{ status: OK, body: layers }],
    [FILES_PATH]: [SURFACE, MASK, PICTURE].map((byte) => ({
      status: OK,
      bytes: new Uint8Array([byte]),
    })),
  });

  it.each([
    ['a tight call at the sharpest asks 0.1 m', true, '0.1'],
    ['any other asks 0.25 m', false, '0.25'],
  ])(
    'a height map: %s; the files come with the key; no flux layer is asked',
    async (_, sharpest, pixel) => {
      answering(files());
      const answer = await new GoogleRoofData(KEY).heightMapAt(
        SANGLI,
        RADIUS_M,
        sharpest,
        billCounter().billed,
      );
      const ask = asked[0];
      expect(ask?.searchParams.get('view')).toBe('IMAGERY_LAYERS');
      expect(ask?.searchParams.get('pixelSizeMeters')).toBe(pixel);
      expect(ask?.searchParams.get('radiusMeters')).toBe(RADIUS_ASKED);
      expect(asked.slice(1).every((file) => file.searchParams.get('key') === KEY)).toBe(true);
      expect(answer).toMatchObject({ quality: 'high', dataOn: '2025-10-07' });
      expect([...(answer?.surface ?? [])]).toEqual([SURFACE]);
      expect([...(answer?.picture ?? [])]).toEqual([PICTURE]);
    },
  );

  it('a file link that ran out is asked for afresh, once', async () => {
    answering({
      [LAYERS_PATH]: [
        { status: OK, body: layers },
        { status: OK, body: layers },
      ],
      [FILES_PATH]: [
        { status: FORBIDDEN },
        ...[MASK, PICTURE, SURFACE, MASK, PICTURE].map((byte) => ({
          status: OK,
          bytes: new Uint8Array([byte]),
        })),
      ],
    });
    const { bill, billed } = billCounter();
    const answer = await new GoogleRoofData(KEY).heightMapAt(SANGLI, CALL_M, false, billed);
    expect(asked.filter((url) => url.pathname === LAYERS_PATH)).toHaveLength(AGAIN);
    expect(bill.calls).toBe(AGAIN);
    expect(answer).not.toBeNull();
  });

  it('links that run out twice reject, both billed asks counted', async () => {
    answering({
      [LAYERS_PATH]: [
        { status: OK, body: layers },
        { status: OK, body: layers },
      ],
      [FILES_PATH]: [],
    });
    const { bill, billed } = billCounter();
    await expect(
      new GoogleRoofData(KEY).heightMapAt(SANGLI, CALL_M, false, billed),
    ).rejects.toThrow(/geoTiff/);
    expect(bill.calls).toBe(AGAIN);
  });

  it('a place with no height map either way is nothing', async () => {
    answering({ [LAYERS_PATH]: [{ status: NOT_FOUND }, { status: NOT_FOUND }] });
    const { bill, billed } = billCounter();
    expect(await new GoogleRoofData(KEY).heightMapAt(SANGLI, CALL_M, false, billed)).toBeNull();
    expect(bill.calls).toBe(0);
  });
});
