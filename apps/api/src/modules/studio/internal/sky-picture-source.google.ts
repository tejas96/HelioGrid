import { createHmac } from 'node:crypto';
import { type Coordinate, groundOf } from '@heliogrid/domain';
import type { SkyPictureSource, SourcePicture } from './sky-picture-source';

const STATIC_MAPS = 'https://maps.googleapis.com/maps/api/staticmap';
/**
 * The sharpest zoom asked for. Google's satellite detail in India ends at 19: zoom 20 is zoom 19
 * enlarged (measured in 6 cities), so 19 gives the same roof over twice the ground.
 */
const ZOOM_SHARPEST = 19;
/** The coarsest zoom tried where Google holds no sharper picture: still a street's houses. */
const ZOOM_COARSEST = 17;
/** Google's largest picture without a premium plan: 640 a side, doubled by `scale`. */
const SIDE = 640;
const SCALE = 2;
/**
 * Where Google holds no picture it answers 200 with a flat grey one of 14–18 KB; the barest real
 * picture measured (mountain rock, Ladakh) was 80 KB. Under this, the zoom is not covered.
 */
const NO_IMAGERY_BYTES = 40_000;
const TIMEOUT_MS = 8_000;
const EQUATOR_METRES_PER_PIXEL_AT_ZOOM_0 = 156_543.033_92;
/** The pixels a side of Google's world at zoom 0, which each zoom doubles. */
const WORLD_PX_AT_ZOOM_0 = 256;
const HALF_TURN = 180;
const TURN = 360;
const RADIANS = Math.PI / HALF_TURN;

const worldX = (longitude: number, world: number) => ((longitude + HALF_TURN) / TURN) * world;
const worldY = (latitude: number, world: number) => {
  const phi = latitude * RADIANS;
  return ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * world;
};
const longitudeAt = (x: number, world: number) => (x / world) * TURN - HALF_TURN;
const latitudeAt = (y: number, world: number) =>
  Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / world))) / RADIANS;

/** Google's URL signature: HMAC-SHA1 of the path and query under the decoded secret, URL-safe. */
function signatureOf(pathAndQuery: string, secret: string): string {
  const key = Buffer.from(secret.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
  return createHmac('sha1', key)
    .update(pathAndQuery)
    .digest('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_');
}

/**
 * Google's satellite picture as ONE Static Maps picture round the pin, on the api's server key:
 * 1,280 px a side in JPEG — Google keeps this imagery as JPEG, so its PNG holds no more detail, only
 * fewer colours at eight times the bytes (measured in 7 Indian places). Static Maps takes the key
 * in the address only, so no address is ever put in an error or a log. With a signing secret every
 * ask is signed, which Google requires for its higher daily quota. The picture is fetched for the
 * one opening that asked and handed on, never kept.
 */
export class GoogleSkyPictureSource implements SkyPictureSource {
  readonly setUp = true;

  constructor(
    private readonly key: string,
    private readonly signingSecret?: string,
  ) {}

  private addressOf(pin: Coordinate, zoom: number): string {
    const query = new URLSearchParams({
      center: `${pin.latitude},${pin.longitude}`,
      zoom: String(zoom),
      size: `${SIDE}x${SIDE}`,
      scale: String(SCALE),
      maptype: 'satellite',
      format: 'jpg',
      key: this.key,
    });
    const address = `${STATIC_MAPS}?${query}`;
    if (this.signingSecret === undefined) return address;
    const signed = `${new URL(STATIC_MAPS).pathname}?${query}`;
    return `${address}&signature=${signatureOf(signed, this.signingSecret)}`;
  }

  async pictureAt(pin: Coordinate): Promise<SourcePicture | null> {
    for (let zoom = ZOOM_SHARPEST; zoom >= ZOOM_COARSEST; zoom -= 1) {
      // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to the map service and no typed client exists for it
      const answer = await fetch(this.addressOf(pin, zoom), {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!answer.ok) throw new Error(`Static Maps answered ${answer.status}`);
      const bytes = Buffer.from(await answer.arrayBuffer());
      if (bytes.length < NO_IMAGERY_BYTES) continue;
      const world = WORLD_PX_AT_ZOOM_0 * 2 ** zoom;
      const half = SIDE / 2;
      const x = worldX(pin.longitude, world);
      const y = worldY(pin.latitude, world);
      const northWest = groundOf(pin, {
        latitude: latitudeAt(y - half, world),
        longitude: longitudeAt(x - half, world),
      });
      const southEast = groundOf(pin, {
        latitude: latitudeAt(y + half, world),
        longitude: longitudeAt(x + half, world),
      });
      return {
        source: 'google',
        // Static Maps burns its logo and imagery owners into the picture's foot, which the studio
        // cuts off as it lays the picture (domain's `creditStripOf`): the chip carries the credit.
        credit: 'Imagery © Google',
        metresPerPixel:
          (EQUATOR_METRES_PER_PIXEL_AT_ZOOM_0 * Math.cos(pin.latitude * RADIANS)) /
          2 ** zoom /
          SCALE,
        takenOn: null,
        pieces: [
          {
            bytes,
            mediaType: 'image/jpeg',
            west: northWest.east,
            north: northWest.north,
            east: southEast.east,
            south: southEast.north,
          },
        ],
        around: [],
      };
    }
    return null;
  }
}
