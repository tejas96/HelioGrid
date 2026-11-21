import {
  type Coordinate,
  type SkyTileKey,
  skyTileGround,
  skyTilePixelMetres,
  skyTileRange,
} from '@heliogrid/domain';
import type {
  SkyPictureSource,
  SourceFacts,
  SourceMarket,
  SourcePicture,
  SourcePiece,
  SourceTile,
} from './sky-picture-source';

const TILES = 'https://tile.googleapis.com';
/** The finest zoom Google cuts its satellite tiles at anywhere. */
const ZOOM_CEILING = 22;
/** The whole picture a studio built before the tiles reads: its sharpest zoom, and its span. */
const WHOLE_ZOOM_MAX = 20;
/**
 * Three tiles a side around the pin's tile: about 115 m across at zoom 20 near the equator — the
 * house and its neighbours close by.
 */
const SPAN = 3;
/** The softer picture round it: the same three tiles a side two zooms coarser. */
const AROUND_ZOOMS_COARSER = 2;
const TIMEOUT_MS = 8_000;
/** A session is renewed this long before Google says it ends. */
const SESSION_MARGIN_MS = 3_600_000;
const MS_PER_SECOND = 1_000;
/** The pin itself, as a box of its ground: the tiles that touch it are the one under it. */
const AT_THE_PIN = { west: 0, east: 0, south: 0, north: 0 };
/** Google's answer for a tile it holds no picture for. */
const NO_TILE = 404;
/** How far round the pin Google is asked what it holds, in degrees: about 200 m. */
const VIEWPORT_REACH_DEGREES = 0.002;
/**
 * The zoom Google is asked about: its credit line names who took the picture at that zoom, and at a
 * zoom finer than its picture it names no one. The zooms its picture reaches come back whatever
 * zoom is asked about.
 */
const VIEWPORT_ZOOM = 20;
/** A tile that did not come is asked for once more before it counts as not answered. */
const TILE_TRIES = 2;

interface Session {
  readonly token: string;
  readonly endsAt: number;
}

interface ZoomRect {
  readonly maxZoom: number;
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
}

/** The highest zoom Google says covers the pin; `null` where it holds no picture of it. */
function zoomAt(pin: Coordinate, rects: readonly ZoomRect[]): number | null {
  const covering = rects.filter(
    (rect) =>
      pin.latitude <= rect.north &&
      pin.latitude >= rect.south &&
      pin.longitude <= rect.east &&
      pin.longitude >= rect.west,
  );
  if (covering.length === 0) return null;
  return Math.min(ZOOM_CEILING, Math.max(...covering.map((rect) => rect.maxZoom)));
}

/**
 * Google's satellite picture through the Map Tiles API (2D tiles), on the api's server key. The key
 * travels in its header, never in an address a log could keep. Every tile comes as a JPEG at twice
 * Google's density (domain's `SKY_TILE_PIXELS`): its PNG holds 256 colours, the JPEG the
 * photograph's own, a third of the size.
 * One session for each market is made once and reused until near its end; every tile is fetched
 * for the one who asked and handed on, never kept.
 */
export class GoogleSkyPictureSource implements SkyPictureSource {
  readonly setUp = true;
  /** Each market's session, as the ask that makes it: two asks at once share the one. */
  private readonly sessions = new Map<string, Promise<Session>>();

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

  private async sessionMade(market: SourceMarket): Promise<Session> {
    const answer = await this.ask(`${TILES}/v1/createSession`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mapType: 'satellite',
        language: market.language,
        region: market.region,
        scale: 'scaleFactor2x',
        highDpi: true,
        imageFormat: 'jpeg',
      }),
    });
    if (!answer.ok) throw new Error(`createSession answered ${answer.status}`);
    const body = (await answer.json()) as { session?: string; expiry?: string };
    if (typeof body.session !== 'string') throw new Error('createSession gave no session');
    return { token: body.session, endsAt: Number(body.expiry ?? 0) * MS_PER_SECOND };
  }

  private async sessionNow(market: SourceMarket): Promise<string> {
    const name = `${market.region}/${market.language}`;
    const held = this.sessions.get(name);
    if (held !== undefined) {
      const session = await held.catch(() => null);
      if (session !== null && session.endsAt - SESSION_MARGIN_MS > Date.now()) return session.token;
      // Another ask may have started the next session while this one read the last.
      if (this.sessions.get(name) !== held) return this.sessionNow(market);
    }
    const making = this.sessionMade(market);
    this.sessions.set(name, making);
    return (await making).token;
  }

  /** What Google holds round the pin: its credit line, and the zoom its picture of the pin reaches. */
  private async seenAt(
    pin: Coordinate,
    session: string,
  ): Promise<{ readonly credit: string; readonly zoom: number } | null> {
    const viewport = new URLSearchParams({
      session,
      zoom: String(VIEWPORT_ZOOM),
      north: String(pin.latitude + VIEWPORT_REACH_DEGREES),
      south: String(pin.latitude - VIEWPORT_REACH_DEGREES),
      east: String(pin.longitude + VIEWPORT_REACH_DEGREES),
      west: String(pin.longitude - VIEWPORT_REACH_DEGREES),
    });
    const seen = await this.ask(`${TILES}/tile/v1/viewport?${viewport}`);
    if (!seen.ok) throw new Error(`viewport answered ${seen.status}`);
    const facts = (await seen.json()) as { copyright?: string; maxZoomRects?: ZoomRect[] };
    const zoom = zoomAt(pin, facts.maxZoomRects ?? []);
    // An empty credit line is none: the picture is still Google's.
    return zoom === null ? null : { credit: facts.copyright || 'Google', zoom };
  }

  async factsAt(pin: Coordinate, market: SourceMarket): Promise<SourceFacts | null> {
    const seen = await this.seenAt(pin, await this.sessionNow(market));
    if (seen === null) return null;
    return { source: 'google', credit: seen.credit, takenOn: null, zoomMax: seen.zoom };
  }

  async tile(key: SkyTileKey, market: SourceMarket): Promise<SourceTile | null> {
    const session = await this.sessionNow(market);
    const url = `${TILES}/v1/2dtiles/${key.z}/${key.x}/${key.y}?session=${session}`;
    let failure: unknown = new Error('no tile was asked for');
    for (let attempt = 0; attempt < TILE_TRIES; attempt += 1) {
      try {
        const answer = await this.ask(url);
        if (answer.status === NO_TILE) return null;
        if (!answer.ok) throw new Error(`tile answered ${answer.status}`);
        return {
          bytes: Buffer.from(await answer.arrayBuffer()),
          cacheControl: answer.headers.get('cache-control'),
          etag: answer.headers.get('etag'),
        };
      } catch (error) {
        failure = error;
      }
    }
    throw failure;
  }

  async pictureAt(pin: Coordinate, market: SourceMarket): Promise<SourcePicture | null> {
    const seen = await this.seenAt(pin, await this.sessionNow(market));
    if (seen === null) return null;
    const zoom = Math.min(WHOLE_ZOOM_MAX, seen.zoom);
    // The sharp picture must all come, or there is none; a tile of the softer one may fail alone.
    const [sharp, coarse] = await Promise.all([
      Promise.all(this.tilesAround(pin, market, zoom)),
      Promise.allSettled(this.tilesAround(pin, market, zoom - AROUND_ZOOMS_COARSER)),
    ]);
    const pieces = sharp.filter((piece) => piece !== null);
    if (pieces.length === 0) return null;
    const around = coarse.flatMap((tile) =>
      tile.status === 'fulfilled' && tile.value !== null ? [tile.value] : [],
    );
    return {
      source: 'google',
      credit: seen.credit,
      metresPerPixel: skyTilePixelMetres(pin.latitude, zoom),
      takenOn: null,
      pieces,
      around,
    };
  }

  /** The tile under the pin at a zoom and the tiles round it, three a side. */
  private tilesAround(
    pin: Coordinate,
    market: SourceMarket,
    zoom: number,
  ): Promise<SourcePiece | null>[] {
    const { x0: centreX, y0: centreY } = skyTileRange(pin, AT_THE_PIN, zoom);
    const half = Math.floor(SPAN / 2);
    const asks: Promise<SourcePiece | null>[] = [];
    for (let dy = -half; dy <= half; dy += 1) {
      for (let dx = -half; dx <= half; dx += 1) {
        asks.push(this.piece(pin, market, { z: zoom, x: centreX + dx, y: centreY + dy }));
      }
    }
    return asks;
  }

  private async piece(
    pin: Coordinate,
    market: SourceMarket,
    key: SkyTileKey,
  ): Promise<SourcePiece | null> {
    const tile = await this.tile(key, market);
    if (tile === null) return null;
    return { bytes: tile.bytes, mediaType: 'image/jpeg', ...skyTileGround(pin, key) };
  }
}
