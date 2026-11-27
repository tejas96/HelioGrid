import type { SkyPictureWire } from '@heliogrid/contracts';
import { type Coordinate, groundOf } from '@heliogrid/domain';
import { rasterOnGround } from '@heliogrid/domain/studio-kernel';
import { encode } from 'jpeg-js';
import { bandsOf } from './geotiff-read';
import type { KeptHeightMap } from './site-data-kept';

/**
 * Google's straight-down picture (`T-M05-002`, part g, board G26): the colour picture from the same
 * height data call, read onto the site's ground round the pin at its own sharpness — a tall wall
 * stands where it is, never leaning over the street. No new call: it is kept with the height map.
 */

/**
 * The picture reaches as far round the pin as the height map it came with, so LiDAR's scan wears it
 * out to the scan's own edge. It travels as a JPEG, a photograph's own format: at the widest map it
 * is a tenth of the PNG it was, small enough for a phone on a weak signal.
 */
const STEP_M = 0.25;
const RGB = 3;
const RGBA = 4;
const OPAQUE = 255;
/** Sharp enough that a panel's edge reads, a tenth of the bytes a PNG takes. */
const JPEG_QUALITY = 80;
const CREDIT = 'Imagery © Google';

/** The map's own ground round the pin. */
function reachOf(kept: KeptHeightMap, pin: Coordinate) {
  const by = groundOf(pin, kept.middle);
  const { west, south, stepM, cols, rows } = kept.grid;
  return {
    west: west + by.east,
    east: west + cols * stepM + by.east,
    south: south + by.north,
    north: south + rows * stepM + by.north,
  };
}

export async function straightDownOf(
  kept: KeptHeightMap,
  pin: Coordinate,
): Promise<SkyPictureWire | null> {
  if (kept.files.picture === null) return null;
  const bands = await bandsOf(Buffer.from(kept.files.picture, 'base64'));
  if (bands.length < RGB) return null;
  const box = reachOf(kept, pin);
  const [red, green, blue] = bands
    .slice(0, RGB)
    .map((band) => rasterOnGround(band, pin, box, STEP_M, true));
  if (red === undefined || green === undefined || blue === undefined) return null;
  const { cols, rows } = red;
  const rgba = Buffer.alloc(cols * rows * RGBA);
  // A grid's row 0 is its southmost; a picture's first row is its top, the north.
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const from = row * cols + col;
      const to = ((rows - 1 - row) * cols + col) * RGBA;
      rgba[to] = Math.round(red.heights[from] ?? 0) || 0;
      rgba[to + 1] = Math.round(green.heights[from] ?? 0) || 0;
      rgba[to + 2] = Math.round(blue.heights[from] ?? 0) || 0;
      rgba[to + RGB] = OPAQUE;
    }
  }
  const jpeg = encode({ data: rgba, width: cols, height: rows }, JPEG_QUALITY);
  return {
    kind: 'picture',
    source: 'google_solar',
    credit: CREDIT,
    metresPerPixel: STEP_M,
    takenOn: kept.dataOn,
    pieces: [
      {
        image: `data:image/jpeg;base64,${jpeg.data.toString('base64')}`,
        west: red.west,
        south: red.south,
        east: red.west + cols * STEP_M,
        north: red.south + rows * STEP_M,
      },
    ],
  };
}
