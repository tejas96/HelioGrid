import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleSkyPictureSource } from '../../src/modules/studio/internal/sky-picture-source.google';

/**
 * The sky picture is ONE Google Static Maps picture round the pin (`T-M05-002a`): zoom 19, 1,280 px
 * a side, JPEG — measured in 7 Indian places as the same detail as zoom 20 PNG at an eighth of the
 * bytes. Where Google holds no picture it answers 200 with a small grey one, so a picture under
 * 40 KB drops a zoom.
 */

const OK = 200;
const SERVER_ERROR = 500;
const KEY = 'server-key';
const SANGLI = { latitude: 16.836668, longitude: 74.596606 };
const EQUATOR_M_PER_PX_AT_ZOOM_0 = 156_543.033_92;
const HALF_TURN_DEGREES = 180;
const RADIANS = Math.PI / HALF_TURN_DEGREES;
/** Half of the 640 a side Google draws the picture at before `scale` doubles it. */
const HALF_SIDE_PX = 320;
/** The pixels a side of the picture as it arrives. */
const PICTURE_PX = 1_280;
/** Decimal places of a metre that a tenth of a millimetre needs. */
const DIGITS_OF_A_TENTH_MM = 4;
const Z19 = 19;
const Z18 = 18;
const Z17 = 17;
/** The ground each way at Sangli at zoom 19, worked out by hand from the formula below. */
const SANGLI_HALF_AT_19_M = 91.45;
const FULL = 40_000;
const JUST_UNDER = 39_999;
const REAL_PICTURE = 250_000;
/** Google's own grey "no imagery" pictures, as measured. */
const GREY = 14_073;
const GREY_WITH_CREDIT = 17_217;
/** Half the picture's side in metres at a zoom: 320 of Google's 256-a-tile pixels each way. */
const halfSide = (zoom: number, latitude: number) =>
  (HALF_SIDE_PX * EQUATOR_M_PER_PX_AT_ZOOM_0 * Math.cos(latitude * RADIANS)) / 2 ** zoom;

const asked: URL[] = [];

/** Google's answer at each zoom: its byte count, or a status it fails with. */
function googleAnswering(byZoom: Record<number, number | { status: number }>) {
  asked.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (address: string) => {
      const url = new URL(address);
      asked.push(url);
      const answer = byZoom[Number(url.searchParams.get('zoom'))] ?? 0;
      if (typeof answer !== 'number') return new Response('refused', { status: answer.status });
      return new Response(new Uint8Array(answer), {
        status: OK,
        headers: { 'content-type': 'image/jpeg' },
      });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the sky picture is one Static Maps picture', () => {
  it('asks once for zoom 19, 640 a side at scale 2, satellite, JPEG, centred on the pin', async () => {
    googleAnswering({ [Z19]: REAL_PICTURE });
    await new GoogleSkyPictureSource(KEY).pictureAt(SANGLI);
    expect(asked).toHaveLength(1);
    const query = asked[0]?.searchParams;
    expect(`${asked[0]?.origin}${asked[0]?.pathname}`).toBe(
      'https://maps.googleapis.com/maps/api/staticmap',
    );
    expect(Object.fromEntries(query ?? [])).toMatchObject({
      center: '16.836668,74.596606',
      zoom: '19',
      size: '640x640',
      scale: '2',
      maptype: 'satellite',
      format: 'jpg',
      key: KEY,
    });
  });

  it('is one JPEG piece about 91 m each way round the pin, with no softer ring', async () => {
    googleAnswering({ [Z19]: REAL_PICTURE });
    const picture = await new GoogleSkyPictureSource(KEY).pictureAt(SANGLI);
    expect(picture?.around).toEqual([]);
    expect(picture?.credit).toBe('Imagery © Google');
    expect(picture?.pieces).toHaveLength(1);
    const piece = picture?.pieces[0];
    const half = halfSide(Z19, SANGLI.latitude);
    expect(half).toBeCloseTo(SANGLI_HALF_AT_19_M, 1);
    expect(piece?.mediaType).toBe('image/jpeg');
    expect(piece?.bytes.length).toBe(REAL_PICTURE);
    for (const side of [piece?.east, piece?.north]) expect(side).toBeCloseTo(half, 0);
    for (const side of [piece?.west, piece?.south]) expect(side).toBeCloseTo(-half, 0);
    // Each pixel of the 1,280 a side covers the side's share of the ground.
    expect(picture?.metresPerPixel).toBeCloseTo((half + half) / PICTURE_PX, DIGITS_OF_A_TENTH_MM);
  });

  it.each([
    ['a full picture at 19', { [Z19]: FULL }, Z19],
    ["Google's grey one at 19 drops to 18", { [Z19]: JUST_UNDER, [Z18]: FULL }, Z18],
    [
      'grey at 19 and 18 drops to 17',
      { [Z19]: GREY_WITH_CREDIT, [Z18]: GREY, [Z17]: REAL_PICTURE },
      Z17,
    ],
  ])('%s', async (_case, byZoom, zoom) => {
    googleAnswering(byZoom);
    const picture = await new GoogleSkyPictureSource(KEY).pictureAt(SANGLI);
    expect(asked.map((url) => Number(url.searchParams.get('zoom')))).toEqual(
      [Z19, Z18, Z17].filter((at) => at >= zoom),
    );
    expect(picture?.pieces[0]?.east).toBeCloseTo(halfSide(zoom, SANGLI.latitude), 0);
  });

  it('grey at every zoom is a place Google does not cover', async () => {
    googleAnswering({ [Z19]: GREY, [Z18]: GREY, [Z17]: GREY });
    expect(await new GoogleSkyPictureSource(KEY).pictureAt(SANGLI)).toBeNull();
    expect(asked).toHaveLength([Z19, Z18, Z17].length);
  });

  it('a refused ask rejects, and its message never carries the key', async () => {
    googleAnswering({ [Z19]: { status: SERVER_ERROR } });
    const asking = new GoogleSkyPictureSource(KEY).pictureAt(SANGLI);
    await expect(asking).rejects.toThrow('500');
    await expect(asking).rejects.not.toThrow(KEY);
  });
});

describe('a signing secret signs every ask', () => {
  // A secret has Google's shape — URL-safe base64 of the HMAC key — made here, so no key is written.
  const SECRET = Buffer.from('a test signing key').toString('base64url');

  it('signs the path and query, keyed by the decoded secret, in URL-safe base64', async () => {
    googleAnswering({ [Z19]: REAL_PICTURE });
    await new GoogleSkyPictureSource(KEY, SECRET).pictureAt(SANGLI);
    const url = asked[0];
    const signature = url?.searchParams.get('signature');
    const signed = `${url?.pathname}?${url?.search.slice(1).replace(/&signature=[^&]*$/, '')}`;
    const expected = createHmac(
      'sha1',
      Buffer.from(SECRET.replaceAll('-', '+').replaceAll('_', '/'), 'base64'),
    )
      .update(signed)
      .digest('base64')
      .replaceAll('+', '-')
      .replaceAll('/', '_');
    expect(signature).toBe(expected);
    expect(url?.search.endsWith(`&signature=${expected}`)).toBe(true);
  });

  it('without a secret the ask carries no signature', async () => {
    googleAnswering({ [Z19]: REAL_PICTURE });
    await new GoogleSkyPictureSource(KEY).pictureAt(SANGLI);
    expect(asked[0]?.searchParams.has('signature')).toBe(false);
  });
});
