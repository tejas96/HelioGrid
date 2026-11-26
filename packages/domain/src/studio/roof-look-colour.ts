import { hexToRgb, linearChannel, type Rgb } from '../format/hex-colour';
import type { GroundPoint } from './ground';
import type { RoofSwatch } from './roof-look-kinds';
import { pointInside } from './roof-shape';

/**
 * The colour a roof's material takes from the sky photo (`T-M05-002`, part e, roof looks): read at
 * points inside the roof, clear of the shade along its sides, and landed on the nearest colour the
 * material is sold in, as the eye sees colour.
 */

/** The photo's colour is read inside a roof this far in from its edge, where a wall's shade falls. */
export const PHOTO_RIM_M = 0.5;

/** sRGB light to CIE XYZ under D65, then to Lab: the published constants. */
const XYZ = [
  [0.4124, 0.3576, 0.1805],
  [0.2126, 0.7152, 0.0722],
  [0.0193, 0.1192, 0.9505],
] as const;
const WHITE = [0.95047, 1, 1.08883] as const;
const LAB_EPSILON = 216 / 24389;
const LAB_KAPPA = 24389 / 27;
const LAB_OFFSET = 16;
const LAB_L = 116;
const LAB_A = 500;
const LAB_B = 200;

function labOf({ r, g, b }: Rgb): readonly [number, number, number] {
  const linear = [linearChannel(r), linearChannel(g), linearChannel(b)] as const;
  const f = XYZ.map((row, i) => {
    const t = (row[0] * linear[0] + row[1] * linear[1] + row[2] * linear[2]) / (WHITE[i] ?? 1);
    return t > LAB_EPSILON ? Math.cbrt(t) : (LAB_KAPPA * t + LAB_OFFSET) / LAB_L;
  }) as [number, number, number];
  return [LAB_L * f[1] - LAB_OFFSET, LAB_A * (f[0] - f[1]), LAB_B * (f[1] - f[2])];
}

/**
 * The colour a look is sold in nearest a colour read off the photo, as the eye sees it (CIE Lab).
 * `colours` are the theme's for the look's swatches (`#RRGGBB`); with none, none.
 */
export function nearestSwatch(
  read: Rgb,
  colours: readonly { readonly swatch: RoofSwatch; readonly hex: string }[],
): RoofSwatch | null {
  const target = labOf(read);
  let best: RoofSwatch | null = null;
  let nearest = Number.POSITIVE_INFINITY;
  for (const { swatch, hex } of colours) {
    const lab = labOf(hexToRgb(hex));
    const far = Math.hypot(lab[0] - target[0], lab[1] - target[1], lab[2] - target[2]);
    if (far < nearest) {
      nearest = far;
      best = swatch;
    }
  }
  return best;
}

/** How far apart the points a roof's colour is read at lie, at the closest, in metres. */
export const PHOTO_READ_STEP_M = 0.25;
/** The most points one outline is read at: a big shed's grid opens out, so a drag stays quick. */
export const PHOTO_READ_MOST = 400;

/** How far a point lies from the nearest side of an outline, in metres. */
function distanceToSides(point: GroundPoint, corners: readonly GroundPoint[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length] as GroundPoint;
    const east = b.east - a.east;
    const north = b.north - a.north;
    const length = east * east + north * north;
    const t =
      length === 0
        ? 0
        : Math.min(
            Math.max(((point.east - a.east) * east + (point.north - a.north) * north) / length, 0),
            1,
          );
    nearest = Math.min(
      nearest,
      Math.hypot(point.east - (a.east + t * east), point.north - (a.north + t * north)),
    );
  });
  return nearest;
}

/**
 * Where a roof's colour is read off the photo: a grid of points inside it, each at least
 * `PHOTO_RIM_M` from its sides, where a wall's or a parapet's shade falls. A roof too narrow to
 * keep the rim is read across its whole inside.
 */
export function photoReadPoints(corners: readonly GroundPoint[]): readonly GroundPoint[] {
  if (corners.length < 3) return [];
  const easts = corners.map((corner) => corner.east);
  const norths = corners.map((corner) => corner.north);
  const [west, east0] = [Math.min(...easts), Math.max(...easts)];
  const [south, north0] = [Math.min(...norths), Math.max(...norths)];
  const step = Math.max(
    PHOTO_READ_STEP_M,
    Math.sqrt(((east0 - west) * (north0 - south)) / PHOTO_READ_MOST),
  );
  const inside: GroundPoint[] = [];
  for (let north = south + step / 2; north < north0; north += step) {
    for (let east = west + step / 2; east < east0; east += step) {
      const point = { east, north };
      if (pointInside(point, corners)) inside.push(point);
    }
  }
  const clear = inside.filter((point) => distanceToSides(point, corners) >= PHOTO_RIM_M);
  return clear.length > 0 ? clear : inside;
}
