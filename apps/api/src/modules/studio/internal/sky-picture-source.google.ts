import { type Coordinate, groundOf } from '@heliogrid/domain';
import type { SkyPictureSource, SourcePicture, SourcePiece } from './sky-picture-source';

const TILES = 'https://tile.googleapis.com';
/** The sharpest zoom asked for: about 15 cm a pixel at the equator, finer towards the poles. */
const ZOOM_MAX = 20;
/**
 * Three tiles a side around the pin's tile: about 115 m across at zoom 20 near the equator — the
 * house and its neighbours close by — for nine billed tiles (the session and viewport are not
 * billed).
 */
const SPAN = 3;
/**
 * The softer picture round it: the same three tiles a side two zooms coarser, each one four sharp
 * tiles across — about 460 m near the equator, the street and the neighbours — for nine more calls.
 */
const AROUND_ZOOMS_COARSER = 2;
const TIMEOUT_MS = 8_000;
/** A session is renewed this long before Google says it ends. */
const SESSION_MARGIN_MS = 3_600_000;
const EQUATOR_METRES_PER_PIXEL_AT_ZOOM_0 = 156_543.033_92;
/**
 * Google's high-density tiles: twice the pixels a side for the same ground, so 512 a side — about
 * 7 cm a pixel at zoom 20 near the equator, as sharp as a Static Maps picture at `scale=2`. Google's
 * own faint marks in the photograph come out small and light, as on its other maps.
 */
const DENSITY = 2;

/**
 * How a tile comes. The sharp picture comes lossless (`png`): Google's JPEG drops about a fifth of
 * the fine detail a roof's edge is traced on (a sharpness measure read 281 against 334, and 350 for the
 * Static Maps `png32` picture other tools draw on). The softer ring round it is only for the
 * surroundings, so it comes as the lighter JPEG.
 */
type TileFormat = 'png' | 'jpeg';
/** Half a turn and a whole turn, in degrees: the tile grid's longitude runs from -180 to 180. */
const HALF_TURN = 180;
const TURN = 360;
const MS_PER_SECOND = 1_000;
/** Google's answer for a tile it holds no picture for. */
const NO_TILE = 404;
const RADIANS = Math.PI / HALF_TURN;

interface Session {
  readonly token: string;
  readonly endsAt: number;
}

const tileX = (longitude: number, zoom: number): number =>
  Math.floor(((longitude + HALF_TURN) / TURN) * 2 ** zoom);

const tileY = (latitude: number, zoom: number): number => {
  const phi = latitude * RADIANS;
  return Math.floor(((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * 2 ** zoom);
};

const longitudeOf = (x: number, zoom: number): number => (x / 2 ** zoom) * TURN - HALF_TURN;

const latitudeOf = (y: number, zoom: number): number =>
  Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / 2 ** zoom))) / RADIANS;

/** The highest zoom Google says covers the pin, capped at the sharpest asked for. */
function zoomAt(
  pin: Coordinate,
  rects: readonly { maxZoom: number; north: number; south: number; east: number; west: number }[],
): number | null {
  const covering = rects.filter(
    (rect) =>
      pin.latitude <= rect.north &&
      pin.latitude >= rect.south &&
      pin.longitude <= rect.east &&
      pin.longitude >= rect.west,
  );
  if (covering.length === 0) return null;
  return Math.min(ZOOM_MAX, Math.max(...covering.map((rect) => rect.maxZoom)));
}

/**
 * Google's satellite picture through the Map Tiles API (2D tiles), on the api's server key. The key
 * travels in its header, never in an address a log could keep. A session is reused until near its
 * end; every tile is fetched for the one opening that asked and handed on, never kept.
 */
export class GoogleSkyPictureSource implements SkyPictureSource {
  readonly setUp = true;
  private readonly sessions = new Map<TileFormat, Session>();

  constructor(private readonly key: string) {}

  private async ask(url: string, init: RequestInit = {}): Promise<Response> {
    // biome-ignore lint/style/noRestrictedGlobals: the ban is on calling OUR wire, which is packages/data's; this is an outbound call to the map service and no typed client exists for it
    const answer = await fetch(url, {
      ...init,
      headers: { 'X-Goog-Api-Key': this.key, ...init.headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return answer;
  }

  private async sessionNow(format: TileFormat): Promise<string> {
    const held = this.sessions.get(format);
    if (held !== undefined && held.endsAt - SESSION_MARGIN_MS > Date.now()) return held.token;
    const answer = await this.ask(`${TILES}/v1/createSession`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mapType: 'satellite',
        language: 'en-US',
        region: 'US',
        scale: 'scaleFactor2x',
        highDpi: true,
        imageFormat: format,
      }),
    });
    if (!answer.ok) throw new Error(`createSession answered ${answer.status}`);
    const body = (await answer.json()) as { session?: string; expiry?: string };
    if (typeof body.session !== 'string') throw new Error('createSession gave no session');
    this.sessions.set(format, {
      token: body.session,
      endsAt: Number(body.expiry ?? 0) * MS_PER_SECOND,
    });
    return body.session;
  }

  async pictureAt(pin: Coordinate): Promise<SourcePicture | null> {
    const [session, ringSession] = await Promise.all([
      this.sessionNow('png'),
      this.sessionNow('jpeg'),
    ]);
    const reach = 0.002;
    const viewport = new URLSearchParams({
      session,
      zoom: String(ZOOM_MAX),
      north: String(pin.latitude + reach),
      south: String(pin.latitude - reach),
      east: String(pin.longitude + reach),
      west: String(pin.longitude - reach),
    });
    const seen = await this.ask(`${TILES}/tile/v1/viewport?${viewport}`);
    if (!seen.ok) throw new Error(`viewport answered ${seen.status}`);
    const facts = (await seen.json()) as {
      copyright?: string;
      maxZoomRects?: {
        maxZoom: number;
        north: number;
        south: number;
        east: number;
        west: number;
      }[];
    };
    const zoom = zoomAt(pin, facts.maxZoomRects ?? []);
    if (zoom === null) return null;
    // The sharp picture must all come, or there is none; a tile of the softer one may fail alone.
    const [sharp, coarse] = await Promise.all([
      Promise.all(this.tilesAround(pin, session, zoom)),
      Promise.allSettled(this.tilesAround(pin, ringSession, zoom - AROUND_ZOOMS_COARSER)),
    ]);
    const pieces = sharp.filter((piece) => piece !== null);
    if (pieces.length === 0) return null;
    const around = coarse.flatMap((tile) =>
      tile.status === 'fulfilled' && tile.value !== null ? [tile.value] : [],
    );
    return {
      source: 'google',
      credit: facts.copyright ?? 'Google',
      metresPerPixel:
        (EQUATOR_METRES_PER_PIXEL_AT_ZOOM_0 * Math.cos(pin.latitude * RADIANS)) /
        2 ** zoom /
        DENSITY,
      takenOn: null,
      pieces,
      around,
    };
  }

  /** The tile under the pin at a zoom and the tiles round it, three a side. */
  private tilesAround(
    pin: Coordinate,
    session: string,
    zoom: number,
  ): Promise<SourcePiece | null>[] {
    const centreX = tileX(pin.longitude, zoom);
    const centreY = tileY(pin.latitude, zoom);
    const half = Math.floor(SPAN / 2);
    const asks: Promise<SourcePiece | null>[] = [];
    for (let dy = -half; dy <= half; dy += 1) {
      for (let dx = -half; dx <= half; dx += 1) {
        asks.push(this.piece(pin, session, zoom, centreX + dx, centreY + dy));
      }
    }
    return asks;
  }

  private async piece(
    pin: Coordinate,
    session: string,
    zoom: number,
    x: number,
    y: number,
  ): Promise<SourcePiece | null> {
    const answer = await this.ask(`${TILES}/v1/2dtiles/${zoom}/${x}/${y}?session=${session}`);
    if (answer.status === NO_TILE) return null;
    if (!answer.ok) throw new Error(`tile answered ${answer.status}`);
    const mediaType = answer.headers.get('content-type')?.includes('png')
      ? 'image/png'
      : 'image/jpeg';
    const northWest = groundOf(pin, {
      latitude: latitudeOf(y, zoom),
      longitude: longitudeOf(x, zoom),
    });
    const southEast = groundOf(pin, {
      latitude: latitudeOf(y + 1, zoom),
      longitude: longitudeOf(x + 1, zoom),
    });
    return {
      bytes: Buffer.from(await answer.arrayBuffer()),
      mediaType,
      west: northWest.east,
      north: northWest.north,
      east: southEast.east,
      south: southEast.north,
    };
  }
}
