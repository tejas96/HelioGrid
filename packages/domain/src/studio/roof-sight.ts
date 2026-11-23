import type { GroundPoint } from './ground';
import type { ModelPoint, SightAt } from './roof-scene';
import { pointInside } from './roof-shape';

/**
 * A tap's line of sight through the 3D model (`T-M05-002`, part e): where it stands at a height,
 * where it meets a face or an upright wall, and where it starts — at the camera.
 */

/** Two heights this close are one. */
const SAME_M = 1e-6;

export interface Sight {
  readonly from: ModelPoint;
  readonly to: ModelPoint;
}

/** The point of the line of sight at a height. */
export function sightAt(sight: Sight, up: number): GroundPoint {
  const share = (up - sight.from.up) / (sight.to.up - sight.from.up);
  return {
    east: sight.from.east + (sight.to.east - sight.from.east) * share,
    north: sight.from.north + (sight.to.north - sight.from.north) * share,
  };
}

/** Where the line of sight meets a face's plane: its height there, inside the face; `null` if not. */
export function onFace(sight: Sight, corners: readonly ModelPoint[]): number | null {
  const [a, b, c] = corners;
  if (a === undefined || b === undefined || c === undefined) return null;
  // The plane's normal: (b − a) × (c − a).
  const u = { e: b.east - a.east, n: b.north - a.north, h: b.up - a.up };
  const v = { e: c.east - a.east, n: c.north - a.north, h: c.up - a.up };
  const normal = { e: u.n * v.h - u.h * v.n, n: u.h * v.e - u.e * v.h, h: u.e * v.n - u.n * v.e };
  const along = {
    e: sight.to.east - sight.from.east,
    n: sight.to.north - sight.from.north,
    h: sight.to.up - sight.from.up,
  };
  const facing = normal.e * along.e + normal.n * along.n + normal.h * along.h;
  if (Math.abs(facing) < SAME_M) return null;
  const toPlane =
    normal.e * (a.east - sight.from.east) +
    normal.n * (a.north - sight.from.north) +
    normal.h * (a.up - sight.from.up);
  const share = toPlane / facing;
  const up = sight.from.up + along.h * share;
  return pointInside(sightAt(sight, up), corners) ? up : null;
}

/** Where the line of sight crosses an upright wall from `from` to `to`; `null` off its span. */
export function onWall(
  sight: Sight,
  from: GroundPoint,
  to: GroundPoint,
  footAt: (share: number) => number,
  topAt: (share: number) => number,
): number | null {
  // Along the sight, plan points move linearly with height: find the height where it crosses the wall's line.
  const p = sightAt(sight, sight.from.up);
  const q = sightAt(sight, sight.to.up);
  const wall = { e: to.east - from.east, n: to.north - from.north };
  const cross = (x: GroundPoint) => (x.east - from.east) * wall.n - (x.north - from.north) * wall.e;
  const atP = cross(p);
  const atQ = cross(q);
  if (Math.abs(atP - atQ) < SAME_M) return null;
  const t = atP / (atP - atQ);
  const up = sight.from.up + (sight.to.up - sight.from.up) * t;
  const point = sightAt(sight, up);
  const span = wall.e * wall.e + wall.n * wall.n;
  if (span === 0) return null;
  const share = ((point.east - from.east) * wall.e + (point.north - from.north) * wall.n) / span;
  if (share < 0 || share > 1) return null;
  return up >= footAt(share) - SAME_M && up <= topAt(share) + SAME_M ? up : null;
}

/** How far a plan point lies from a segment, in metres. */
export function farFrom(point: GroundPoint, from: GroundPoint, to: GroundPoint): number {
  const de = to.east - from.east;
  const dn = to.north - from.north;
  const span = de * de + dn * dn;
  const share =
    span === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, ((point.east - from.east) * de + (point.north - from.north) * dn) / span),
        );
  return Math.hypot(point.east - (from.east + de * share), point.north - (from.north + dn * share));
}

/** Steps of the search for where the line of sight starts: well under a millimetre. */
const SEARCH_STEPS = 32;

/** The height between `answers` and `silent` where the line of sight starts to answer: the camera's. */
function cameraAt(at: SightAt, answers: number, silent: number): number {
  let near = answers;
  let far = silent;
  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const middle = (near + far) / 2;
    if (at(middle) === null) far = middle;
    else near = middle;
  }
  return near;
}

/**
 * The heights the line of sight is read between: `near` the camera's end, `far` the other. A height
 * behind the camera reads `null`, so a camera between the ground and `highest` is found by search
 * — looking down, below `highest`; looking up, above the ground. `null` when nothing answers.
 */
export function sightEnds(at: SightAt, highest: number): { near: number; far: number } | null {
  const high = at(highest) !== null;
  const low = at(0) !== null;
  if (high && low) return { near: highest, far: 0 };
  if (low) return { near: cameraAt(at, 0, highest), far: 0 };
  if (high) return { near: cameraAt(at, highest, 0), far: highest };
  return null;
}
