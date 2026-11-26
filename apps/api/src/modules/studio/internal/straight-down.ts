import type { SkyPictureWire } from '@heliogrid/contracts';
import type { Coordinate } from '@heliogrid/domain';
import { rasterOnGround } from '@heliogrid/domain/studio-kernel';
import { bandsOf } from './geotiff-read';
import { pngOf } from './png-encode';
import type { KeptHeightMap } from './site-data-kept';

/**
 * Google's straight-down picture (`T-M05-002`, part g, board G26): the colour picture from the same
 * height data call, read onto the site's ground round the pin at its own sharpness — a tall wall
 * stands where it is, never leaning over the street. No new call: it is kept with the height map.
 */

/** The picture reaches this far round the pin: past a house and its street. */
const REACH_M = 40;
const STEP_M = 0.25;
const RGB = 3;
const CREDIT = 'Imagery © Google';

export async function straightDownOf(
  kept: KeptHeightMap,
  pin: Coordinate,
): Promise<SkyPictureWire | null> {
  if (kept.files.picture === null) return null;
  const bands = await bandsOf(Buffer.from(kept.files.picture, 'base64'));
  if (bands.length < RGB) return null;
  const box = { west: -REACH_M, east: REACH_M, south: -REACH_M, north: REACH_M };
  const [red, green, blue] = bands
    .slice(0, RGB)
    .map((band) => rasterOnGround(band, pin, box, STEP_M, true));
  if (red === undefined || green === undefined || blue === undefined) return null;
  const { cols, rows } = red;
  const rgb = new Uint8Array(cols * rows * RGB);
  // A grid's row 0 is its southmost; a picture's first row is its top, the north.
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const from = row * cols + col;
      const to = ((rows - 1 - row) * cols + col) * RGB;
      rgb[to] = Math.round(red.heights[from] ?? 0) || 0;
      rgb[to + 1] = Math.round(green.heights[from] ?? 0) || 0;
      rgb[to + 2] = Math.round(blue.heights[from] ?? 0) || 0;
    }
  }
  const png = pngOf(cols, rows, rgb);
  return {
    kind: 'picture',
    source: 'google_solar',
    credit: CREDIT,
    metresPerPixel: STEP_M,
    takenOn: kept.dataOn,
    pieces: [
      {
        image: `data:image/png;base64,${png.toString('base64')}`,
        west: red.west,
        south: red.south,
        east: red.west + cols * STEP_M,
        north: red.south + rows * STEP_M,
      },
    ],
  };
}
