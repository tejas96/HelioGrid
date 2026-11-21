import type { Coordinate } from '../format/areas';
import type { Roof } from './document';
import { coordinateOf, type GroundBox, groundOf } from './ground';
import type { DesignMount } from './vocabulary';

/**
 * The sky picture as tiles (`T-M05-002a`): the studio asks only for the ground the camera sees, at
 * the zoom the screen can show, so the roof a person came for is sharp wherever it lies. The tiles
 * are the map services' own grid (Web Mercator, `z/x/y`, row 0 in the north); every rule here is in
 * the site's ground (`ground.ts`), so the screens and the api agree on one grid.
 */

/**
 * A tile's side, in pixels. Tiles are asked at twice the provider's own density: one billed call
 * then carries the pixels of four. Every zoom in this file — a tile's, a site's cap, a market's
 * cap on true detail — is the zoom of a tile this size.
 */
export const SKY_TILE_PIXELS = 512;
/**
 * The provider's own tile. A picture's real detail is told as that tile's pixel at the cap: the
 * last zoom adds some detail but not twice as much, so the detail is nearer two of a tile's pixels
 * than one.
 */
const PROVIDER_TILE_PIXELS = 256;
/** The equator's length on WGS 84's sphere: the ground one zoom 0 tile spans there. */
const WORLD_M = 2 * Math.PI * 6_378_137;
const HALF_TURN = 180;
const TURN = 360;
const RADIANS = Math.PI / HALF_TURN;
/** Web Mercator's own limit: the grid ends there, north and south. */
const LATITUDE_MAX = 85.051_128;

/**
 * The coarsest zoom is the finest at which the reach is at most this many tiles across, so the
 * first picture is at most one more than this a side: nine tiles.
 */
const BASE_TILES_ACROSS = 2;
const FIRST_PICTURE_TILES_MAX = (BASE_TILES_ACROSS + 1) ** 2;
/** The most tiles a design opens on: the first picture, and the first view's. */
export const SKY_TILES_PER_OPENING_MAX = 30;
/**
 * The most tiles one view asks for at its zoom: what an opening has left after the first picture.
 * Past it the view drops a zoom — a softer picture, whole — rather than leave part of the ground
 * without one.
 */
export const SKY_TILES_PER_VIEW_MAX = SKY_TILES_PER_OPENING_MAX - FIRST_PICTURE_TILES_MAX;
/**
 * How long a ticket to a site's tiles lasts, in seconds: a studio stays open for a working
 * session, and the ticket is asked for again before it runs out.
 */
export const SKY_TICKET_SECONDS = 3_600;
/** How far round the pin and every roof a roof site's picture may be fetched, in metres. */
export const SKY_REACH_ROUND_ROOFS_M = 300;
/** How far round a ground mount's land its picture may be fetched, in metres. */
export const SKY_REACH_ROUND_LAND_M = 100;
const HALF_TILE = 0.5;

/** One tile of the grid: its zoom, its column from the west and its row from the north. */
export interface SkyTileKey {
  readonly z: number;
  readonly x: number;
  readonly y: number;
}

/** The zooms a site's picture may be asked at: the coarsest, which covers the reach, and the cap. */
export interface SkyTileZooms {
  readonly zoomMin: number;
  readonly zoomMax: number;
}

/**
 * A run of tiles at one zoom: columns `x0` to `x1` and rows `y0` to `y1`, both ends in. A column
 * is counted on from the grid's west edge without wrapping, so a run across the date line stays one
 * run.
 */
export interface SkyTileRange {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const tileMetres = (latitude: number, zoom: number): number =>
  (WORLD_M * Math.cos(latitude * RADIANS)) / 2 ** zoom;

/** The ground one pixel of a tile covers at a zoom, at this latitude. */
export function skyTilePixelMetres(latitude: number, zoom: number): number {
  return tileMetres(latitude, zoom) / SKY_TILE_PIXELS;
}

/**
 * The picture's real detail: the ground one pixel of the provider's own picture covers at the
 * finest zoom that holds true detail. A tile shows that pixel on two of its own.
 */
export function skyRealDetailMetres(latitude: number, zoomMax: number): number {
  return tileMetres(latitude, zoomMax) / PROVIDER_TILE_PIXELS;
}

/**
 * The zoom a view asks for: the coarsest whose pixel is no bigger than one pixel of the device, so
 * nothing finer than the screen can show is fetched — never past the cap, never below the coarsest.
 * A reading that is no length is the camera at its nearest.
 */
export function skyTileZoom(
  metresPerDevicePixel: number,
  latitude: number,
  { zoomMin, zoomMax }: SkyTileZooms,
): number {
  if (!(metresPerDevicePixel > 0)) return zoomMax;
  const wanted = Math.ceil(Math.log2(skyTilePixelMetres(latitude, 0) / metresPerDevicePixel));
  return Math.min(zoomMax, Math.max(zoomMin, wanted));
}

const padded = (box: GroundBox, by: number): GroundBox => ({
  west: box.west - by,
  east: box.east + by,
  south: box.south - by,
  north: box.north + by,
});

/**
 * The ground a site's picture may be fetched for, in metres from the pin as the picture lies. A
 * roof site: round the pin and every roof. A ground mount: its land and a margin; until the land
 * is drawn, as a roof site's. A roof is stored at its true size, so it is read back through the
 * picture's stretch to where it lies on the picture.
 */
export function skyTileReach(
  mount: DesignMount,
  site: {
    readonly roofs: readonly Roof[];
    readonly pictureScale: number;
    /** The land of a ground mount, in metres from the pin; `null` until it is drawn. */
    readonly land: GroundBox | null;
  },
): GroundBox {
  if (mount === 'ground' && site.land !== null) return padded(site.land, SKY_REACH_ROUND_LAND_M);
  const corners = site.roofs.flatMap((roof) => roof.corners);
  const easts = [0, ...corners.map((corner) => corner.east / site.pictureScale)];
  const norths = [0, ...corners.map((corner) => corner.north / site.pictureScale)];
  return padded(
    {
      west: Math.min(...easts),
      east: Math.max(...easts),
      south: Math.min(...norths),
      north: Math.max(...norths),
    },
    SKY_REACH_ROUND_ROOFS_M,
  );
}

/**
 * The coarsest zoom a site's picture is asked at: the finest at which the reach is at most two
 * tiles across, so a few tiles lay a first picture over all of it. Never past the cap.
 */
export function skyTileZoomMin(latitude: number, reach: GroundBox, zoomMax: number): number {
  const across = Math.max(reach.east - reach.west, reach.north - reach.south);
  const fits = Math.floor(Math.log2((BASE_TILES_ACROSS * tileMetres(latitude, 0)) / across));
  return Math.max(0, Math.min(zoomMax, fits));
}

/** A longitude's column and a latitude's row at a zoom, as parts of a tile; the column unwrapped. */
const columnOf = (longitude: number, zoom: number): number =>
  ((longitude + HALF_TURN) / TURN) * 2 ** zoom;

function rowOf(latitude: number, zoom: number): number {
  const phi = Math.max(-LATITUDE_MAX, Math.min(LATITUDE_MAX, latitude)) * RADIANS;
  return ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * 2 ** zoom;
}

const longitudeOf = (column: number, zoom: number): number =>
  (column / 2 ** zoom) * TURN - HALF_TURN;

const latitudeOf = (row: number, zoom: number): number =>
  Math.atan(Math.sinh(Math.PI * (1 - (2 * row) / 2 ** zoom))) / RADIANS;

/** The tiles at a zoom that touch a box of the site's ground. */
export function skyTileRange(pin: Coordinate, box: GroundBox, zoom: number): SkyTileRange {
  const northWest = coordinateOf(pin, { east: box.west, north: box.north });
  const southEast = coordinateOf(pin, { east: box.east, north: box.south });
  const last = 2 ** zoom - 1;
  const row = (latitude: number) => Math.max(0, Math.min(last, Math.floor(rowOf(latitude, zoom))));
  return {
    x0: Math.floor(columnOf(northWest.longitude, zoom)),
    x1: Math.floor(columnOf(southEast.longitude, zoom)),
    y0: row(northWest.latitude),
    y1: row(southEast.latitude),
  };
}

/** A column counted past either end of the grid, brought back onto it. */
const wrapped = (column: number, zoom: number): number => {
  const columns = 2 ** zoom;
  return ((column % columns) + columns) % columns;
};

/**
 * Where a tile lies on the site's ground, in metres from the pin. The grid goes round the world:
 * the copy of the tile nearest the pin is the one meant, so a site on the date line reads true.
 */
export function skyTileGround(pin: Coordinate, key: SkyTileKey): GroundBox {
  const west = longitudeOf(key.x, key.z);
  const turns = Math.round((pin.longitude - west) / TURN) * TURN;
  const northWest = groundOf(pin, {
    latitude: latitudeOf(key.y, key.z),
    longitude: west + turns,
  });
  const southEast = groundOf(pin, {
    latitude: latitudeOf(key.y + 1, key.z),
    longitude: longitudeOf(key.x + 1, key.z) + turns,
  });
  return {
    west: northWest.east,
    north: northWest.north,
    east: southEast.east,
    south: southEast.north,
  };
}

/**
 * The tiles a view needs: those under the ground it sees, never past the reach, nearest the middle
 * of the view first. A view of more tiles than one may ask for drops a zoom, down to the coarsest,
 * rather than cut the picture.
 */
export function skyTilesInView(
  pin: Coordinate,
  seen: GroundBox,
  reach: GroundBox,
  zoom: number,
  zoomMin: number,
): { readonly zoom: number; readonly tiles: readonly SkyTileKey[] } {
  const box: GroundBox = {
    west: Math.max(seen.west, reach.west),
    east: Math.min(seen.east, reach.east),
    south: Math.max(seen.south, reach.south),
    north: Math.min(seen.north, reach.north),
  };
  if (box.west >= box.east || box.south >= box.north) return { zoom, tiles: [] };
  const count = (range: SkyTileRange) => (range.x1 - range.x0 + 1) * (range.y1 - range.y0 + 1);
  let at = zoom;
  let range = skyTileRange(pin, box, at);
  while (count(range) > SKY_TILES_PER_VIEW_MAX && at > zoomMin) {
    at -= 1;
    range = skyTileRange(pin, box, at);
  }
  const centre = coordinateOf(pin, {
    east: (box.west + box.east) / 2,
    north: (box.south + box.north) / 2,
  });
  // The view's middle, in tiles: a tile's own middle is half a tile on from its corner.
  const middle = {
    column: columnOf(centre.longitude, at) - HALF_TILE,
    row: rowOf(centre.latitude, at) - HALF_TILE,
  };
  const tiles: { readonly key: SkyTileKey; readonly far: number }[] = [];
  for (let row = range.y0; row <= range.y1; row += 1) {
    for (let column = range.x0; column <= range.x1; column += 1) {
      tiles.push({
        key: { z: at, x: wrapped(column, at), y: row },
        far: Math.hypot(column - middle.column, row - middle.row),
      });
    }
  }
  tiles.sort((a, b) => a.far - b.far);
  return { zoom: at, tiles: tiles.map((tile) => tile.key) };
}

/**
 * Whether a tile is one a site's picture may be asked for: a real tile of the grid, at a zoom the
 * site allows, touching the run of tiles its reach covers at the cap. The api checks every tile it
 * is asked for with it, so no one fetches ground past a site through it.
 */
export function skyTileAllowed(
  key: SkyTileKey,
  reachAtCap: SkyTileRange,
  { zoomMin, zoomMax }: SkyTileZooms,
): boolean {
  const { z, x, y } = key;
  if (![z, x, y].every(Number.isInteger)) return false;
  if (z < zoomMin || z > zoomMax) return false;
  const columns = 2 ** z;
  if (x < 0 || x >= columns || y < 0 || y >= columns) return false;
  // The tile, as the run of cap-zoom tiles it covers.
  const each = 2 ** (zoomMax - z);
  if ((y + 1) * each - 1 < reachAtCap.y0 || y * each > reachAtCap.y1) return false;
  // The reach's run is unwrapped: the tile is tried where it lies and one world to either side.
  return [-1, 0, 1].some((turn) => {
    const first = (x + turn * columns) * each;
    return first + each - 1 >= reachAtCap.x0 && first <= reachAtCap.x1;
  });
}
