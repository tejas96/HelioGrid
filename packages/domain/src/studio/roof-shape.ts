import { type GroundBox, type GroundPoint, meanOf } from './ground';

/**
 * Two corners of a roof never stand nearer than this, so no edge is shorter (`T-M05-002`, part b):
 * a tap this near the last corner places nothing — a double tap is one corner — and one this near
 * another, a drag or a length that would bring two this close, is refused.
 */
export const CORNER_GAP_M = 0.3;

/**
 * A roof's outline on the site's ground (`ground.ts`): its corners in order, edge i running from
 * corner i to corner i + 1 and the last edge back to the first corner. Pure plane geometry, in
 * metres; every rule of the roof step (`roof-draw.ts`, `roof-edit.ts`) is built on these.
 */

/** A roof has at least three corners, and no more than this. */
export const ROOF_CORNERS_MIN = 3;
export const ROOF_CORNERS_MAX = 100;

/**
 * Below this, two places on the ground are one: a millimetre, far finer than any picture or tape.
 * It keeps a corner that sits on an edge from reading as a crossing by a rounding error.
 */
const SAME_M = 1e-3;

const DEGREES = 180 / Math.PI;

export function between(a: GroundPoint, b: GroundPoint): number {
  return Math.hypot(b.east - a.east, b.north - a.north);
}

/** The corner after corner `i`, round to the first. */
export function cornerAfter(corners: readonly GroundPoint[], i: number): GroundPoint {
  return corners[(i + 1) % corners.length] as GroundPoint;
}

/** The corner before corner `i`, round to the last. */
export function cornerBefore(corners: readonly GroundPoint[], i: number): GroundPoint {
  return corners[(i - 1 + corners.length) % corners.length] as GroundPoint;
}

/** Each edge's length: edge i from corner i to corner i + 1. */
export function edgeLengths(corners: readonly GroundPoint[]): number[] {
  return corners.map((corner, i) => between(corner, cornerAfter(corners, i)));
}

/** Twice the area, signed: positive when the corners run anticlockwise. */
function twiceSignedArea(corners: readonly GroundPoint[]): number {
  let sum = 0;
  corners.forEach((corner, i) => {
    const next = cornerAfter(corners, i);
    sum += corner.east * next.north - next.east * corner.north;
  });
  return sum;
}

/** The roof's area in square metres, whichever way round its corners run. */
export function roofArea(corners: readonly GroundPoint[]): number {
  return Math.abs(twiceSignedArea(corners)) / 2;
}

/** The middle of the roof's area, where it turns about; the corners' mean for a roof with no area. */
export function roofMiddle(corners: readonly GroundPoint[]): GroundPoint {
  const twice = twiceSignedArea(corners);
  if (Math.abs(twice) < SAME_M * SAME_M) return meanOf(corners);
  let east = 0;
  let north = 0;
  corners.forEach((corner, i) => {
    const next = cornerAfter(corners, i);
    const cross = corner.east * next.north - next.east * corner.north;
    east += (corner.east + next.east) * cross;
    north += (corner.north + next.north) * cross;
  });
  return { east: east / (3 * twice), north: north / (3 * twice) };
}

/** The angle at corner `i` between its two edges, in degrees, 0 to 180. */
export function cornerAngle(corners: readonly GroundPoint[], i: number): number {
  const at = corners[i] as GroundPoint;
  return angleAt(cornerBefore(corners, i), at, cornerAfter(corners, i));
}

/** The angle at `at` between the lines to `from` and to `to`, in degrees, 0 to 180. */
export function angleAt(from: GroundPoint, at: GroundPoint, to: GroundPoint): number {
  const a = Math.atan2(from.north - at.north, from.east - at.east);
  const b = Math.atan2(to.north - at.north, to.east - at.east);
  const turn = Math.abs(a - b) * DEGREES;
  return turn > 180 ? 360 - turn : turn;
}

/** Which side of the line a → b the point c lies: + left, − right, 0 on it (within a millimetre). */
function side(a: GroundPoint, b: GroundPoint, c: GroundPoint): number {
  const cross = (b.east - a.east) * (c.north - a.north) - (b.north - a.north) * (c.east - a.east);
  const reach = between(a, b);
  if (reach === 0 || Math.abs(cross) / reach < SAME_M) return 0;
  return Math.sign(cross);
}

/** Whether c, on the line a → b, lies on the segment between them. */
function onSegment(a: GroundPoint, b: GroundPoint, c: GroundPoint): boolean {
  return (
    Math.min(a.east, b.east) - SAME_M <= c.east &&
    c.east <= Math.max(a.east, b.east) + SAME_M &&
    Math.min(a.north, b.north) - SAME_M <= c.north &&
    c.north <= Math.max(a.north, b.north) + SAME_M
  );
}

/** Two segments cross each other: each runs from one side of the other to its other side. */
export function segmentsCross(
  a: GroundPoint,
  b: GroundPoint,
  c: GroundPoint,
  d: GroundPoint,
): boolean {
  const ab = side(a, b, c) * side(a, b, d);
  const cd = side(c, d, a) * side(c, d, b);
  return ab < 0 && cd < 0;
}

/** Two segments meet anywhere: they cross, or one touches the other. */
function segmentsMeet(a: GroundPoint, b: GroundPoint, c: GroundPoint, d: GroundPoint): boolean {
  if (segmentsCross(a, b, c, d)) return true;
  return (
    (side(a, b, c) === 0 && onSegment(a, b, c)) ||
    (side(a, b, d) === 0 && onSegment(a, b, d)) ||
    (side(c, d, a) === 0 && onSegment(c, d, a)) ||
    (side(c, d, b) === 0 && onSegment(c, d, b))
  );
}

/** Two neighbour edges, meeting at `shared`, fold back along each other. */
function foldsBack(far1: GroundPoint, shared: GroundPoint, far2: GroundPoint): boolean {
  return side(far1, shared, far2) === 0 && angleAt(far1, shared, far2) < 90;
}

/** Edges i and j of an outline go wrong together: neighbours fold back, others meet at all. */
function edgesClash(
  corners: readonly GroundPoint[],
  i: number,
  j: number,
  closed: boolean,
): boolean {
  const a = corners[i] as GroundPoint;
  const b = cornerAfter(corners, i);
  const c = corners[j] as GroundPoint;
  const d = cornerAfter(corners, j);
  if (j === i + 1) return foldsBack(a, b, d);
  if (closed && i === 0 && j === corners.length - 1) return foldsBack(b, a, c);
  return segmentsMeet(a, b, c, d);
}

/**
 * Whether the outline is not one clean shape: two edges that are not neighbours meet, or two
 * neighbours fold back along each other. `closed: false` reads an outline still being drawn, whose
 * last corner does not yet join the first.
 */
export function edgesCross(corners: readonly GroundPoint[], closed = true): boolean {
  const count = closed ? corners.length : corners.length - 1;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      if (edgesClash(corners, i, j, closed)) return true;
    }
  }
  return false;
}

/** The shortest way from a point to a segment, in metres. */
export function distanceToSegment(point: GroundPoint, a: GroundPoint, b: GroundPoint): number {
  return between(point, nearestOnSegment(point, a, b));
}

/** The place on the segment a → b nearest the point. */
export function nearestOnSegment(point: GroundPoint, a: GroundPoint, b: GroundPoint): GroundPoint {
  const east = b.east - a.east;
  const north = b.north - a.north;
  const reach = east * east + north * north;
  if (reach === 0) return a;
  const along = ((point.east - a.east) * east + (point.north - a.north) * north) / reach;
  const t = Math.min(1, Math.max(0, along));
  return { east: a.east + east * t, north: a.north + north * t };
}

/** Whether a point lies inside the roof. A point on its edge is not inside. */
export function pointInside(point: GroundPoint, corners: readonly GroundPoint[]): boolean {
  let inside = false;
  for (let i = 0; i < corners.length; i += 1) {
    const a = corners[i] as GroundPoint;
    const b = cornerAfter(corners, i);
    if (distanceToSegment(point, a, b) < SAME_M) return false;
    const spans = a.north > point.north !== b.north > point.north;
    if (spans) {
      const eastAt = a.east + ((point.north - a.north) / (b.north - a.north)) * (b.east - a.east);
      if (point.east < eastAt) inside = !inside;
    }
  }
  return inside;
}

/** The roof's corners, the middles of its edges and one point inside it: what tells overlap apart. */
function samplesOf(corners: readonly GroundPoint[]): GroundPoint[] {
  const middles = corners.map((corner, i) => {
    const next = cornerAfter(corners, i);
    return { east: (corner.east + next.east) / 2, north: (corner.north + next.north) / 2 };
  });
  return [...corners, ...middles, innerPoint(corners)];
}

/**
 * Whether two roofs overlap: an edge of one crosses an edge of the other, or one lies inside the
 * other. Two roofs that share a wall, or touch at a corner, do not overlap.
 */
export function roofsOverlap(one: readonly GroundPoint[], other: readonly GroundPoint[]): boolean {
  for (let i = 0; i < one.length; i += 1) {
    for (let j = 0; j < other.length; j += 1) {
      if (
        segmentsCross(
          one[i] as GroundPoint,
          cornerAfter(one, i),
          other[j] as GroundPoint,
          cornerAfter(other, j),
        )
      ) {
        return true;
      }
    }
  }
  return (
    samplesOf(one).some((point) => pointInside(point, other)) ||
    samplesOf(other).some((point) => pointInside(point, one))
  );
}

/**
 * A point well inside the roof: its middle when that is inside, else the middle of the widest
 * stretch of roof on the east–west line through it — the inside of an L, not its cut-away corner.
 */
export function innerPoint(corners: readonly GroundPoint[]): GroundPoint {
  const middle = roofMiddle(corners);
  if (pointInside(middle, corners)) return middle;
  const souths = corners.map((c) => c.north);
  const low = Math.min(...souths);
  const high = Math.max(...souths);
  // The line through the middle first, then lines either side of it, until one crosses the roof.
  const tries = [middle.north];
  for (let k = 1; k <= 8; k += 1) {
    tries.push(middle.north + ((high - low) * k) / 18, middle.north - ((high - low) * k) / 18);
  }
  for (const north of tries) {
    const crossings = corners
      .flatMap((a, i) => {
        const b = cornerAfter(corners, i);
        if (a.north > north === b.north > north) return [];
        return [a.east + ((north - a.north) / (b.north - a.north)) * (b.east - a.east)];
      })
      .sort((x, y) => x - y);
    let best: GroundPoint | null = null;
    let widest = 0;
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const width = (crossings[k + 1] as number) - (crossings[k] as number);
      if (width > widest) {
        widest = width;
        best = { east: ((crossings[k] as number) + (crossings[k + 1] as number)) / 2, north };
      }
    }
    if (best !== null && pointInside(best, corners)) return best;
  }
  return middle;
}

/** The two handles inside a roof: one moves it, one turns it about its middle. */
export interface RoofHandles {
  readonly move: GroundPoint;
  readonly turn: GroundPoint;
  /** The roof is too small to hold both: the turn handle steps outside, past a corner. */
  readonly turnOutside: boolean;
}

/**
 * Where the move and the turn handle sit, `gap` metres apart (the handles' size on screen, in
 * ground metres). The move handle is inside the roof; the turn handle sits east of it while both
 * fit, and on a small roof steps outside past its north-east corner, so the two never overlap.
 */
export function roofHandles(corners: readonly GroundPoint[], gap: number): RoofHandles {
  const move = innerPoint(corners);
  const beside = { east: move.east + gap, north: move.north };
  const room = Math.min(
    ...corners.map((corner, i) => distanceToSegment(beside, corner, cornerAfter(corners, i))),
  );
  if (pointInside(beside, corners) && room >= gap / 2) {
    return { move, turn: beside, turnOutside: false };
  }
  const corner = corners.reduce((best, c) =>
    c.east + c.north > best.east + best.north ? c : best,
  );
  const reach = between(move, corner) || 1;
  return {
    move,
    turn: {
      east: corner.east + ((corner.east - move.east) / reach) * gap,
      north: corner.north + ((corner.north - move.north) / reach) * gap,
    },
    turnOutside: true,
  };
}

/** The ground the roofs cover, which the camera frames; `null` with none. */
export function roofsBox(
  roofs: readonly { readonly corners: readonly GroundPoint[] }[],
): GroundBox | null {
  const corners = roofs.flatMap((roof) => roof.corners);
  if (corners.length === 0) return null;
  return {
    west: Math.min(...corners.map((c) => c.east)),
    east: Math.max(...corners.map((c) => c.east)),
    south: Math.min(...corners.map((c) => c.north)),
    north: Math.max(...corners.map((c) => c.north)),
  };
}
