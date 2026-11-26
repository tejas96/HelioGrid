import type { GroundPoint } from './ground';
import {
  between,
  edgesCross,
  nearestOnSegment,
  ROOF_CORNERS_MAX,
  roofsOverlap,
} from './roof-shape';
import type { SnapOwner, SnapTargets } from './roof-snap';

/**
 * Follow the wall (`T-M05-002`, part e): a roof drawn against another, whose first and last
 * corners both stand on the other's outline with its corners between them, can take those
 * corners in one tap and close along the shared wall. Offered, never done by itself: an upper floor
 * drawn over a lower roof touches its walls too, and there a straight side is right.
 */

/** A corner within this of an outline stands on it, in metres: a snapped corner, less rounding. */
const ON_OUTLINE_M = 1e-3;

export interface FollowAlong {
  /** The roof (or the face) whose outline the new roof follows. */
  readonly owner: SnapOwner;
  /** Its corners the new roof takes, after its last corner, in order. */
  readonly corners: readonly GroundPoint[];
}

function ownerKey(owner: SnapOwner): string {
  switch (owner.kind) {
    case 'roof':
      return `r${owner.roof}`;
    case 'face':
      return `f${owner.roof}.${owner.face}`;
    default:
      // A building's eave is one of its walls: one outline to follow.
      return `b${owner.building}`;
  }
}

/** The outlines a drawing can follow, each its corners in order. */
function outlinesOf(targets: SnapTargets): { owner: SnapOwner; ring: GroundPoint[] }[] {
  const rings = new Map<string, { owner: SnapOwner; ring: GroundPoint[] }>();
  for (const corner of targets.corners) {
    const key = ownerKey(corner.owner);
    const held = rings.get(key) ?? { owner: corner.owner, ring: [] };
    held.ring.push(corner.at);
    rings.set(key, held);
  }
  return [...rings.values()];
}

/**
 * The sides of the outline a point stands on: side i runs from corner i to corner i + 1. A point on
 * one of the outline's corners stands on both sides that meet there.
 */
function sidesUnder(ring: readonly GroundPoint[], point: GroundPoint): number[] {
  return ring.flatMap((from, i) => {
    const to = ring[(i + 1) % ring.length] as GroundPoint;
    return between(point, nearestOnSegment(point, from, to)) <= ON_OUTLINE_M ? [i] : [];
  });
}

/** How long a way is, from `from` through `path` to `to`. */
function lengthOf(from: GroundPoint, path: readonly GroundPoint[], to: GroundPoint): number {
  const stops = [from, ...path, to];
  let sum = 0;
  for (let i = 1; i < stops.length; i += 1) {
    sum += between(stops[i - 1] as GroundPoint, stops[i] as GroundPoint);
  }
  return sum;
}

/**
 * The outline's corners met going each way round from side `start` to side `end`: forward from
 * the corner after `start`, and back from `start`'s own corner.
 */
function waysRound(ring: readonly GroundPoint[], start: number, end: number): GroundPoint[][] {
  const count = ring.length;
  const forward: GroundPoint[] = [];
  for (let i = (start + 1) % count; ; i = (i + 1) % count) {
    forward.push(ring[i] as GroundPoint);
    if (i === end) break;
  }
  const back: GroundPoint[] = [];
  for (let i = start; ; i = (i - 1 + count) % count) {
    back.push(ring[i] as GroundPoint);
    if (i === (end + 1) % count) break;
  }
  return [forward, back];
}

/**
 * The corners to follow from the drawing's last corner round to its first, along the outline both
 * stand on: the shorter way that has a corner on it, keeps the roof's sides from crossing and the
 * roof off the other, and leaves it no more than `ROOF_CORNERS_MAX` corners. `null` when there is
 * none: fewer than three corners, an end off every outline, or the two ends on one side of it.
 */
export function followAlong(
  corners: readonly GroundPoint[],
  targets: SnapTargets,
): FollowAlong | null {
  if (corners.length < 3) return null;
  const first = corners[0] as GroundPoint;
  const last = corners.at(-1) as GroundPoint;
  for (const { owner, ring } of outlinesOf(targets)) {
    const starts = sidesUnder(ring, last);
    const ends = sidesUnder(ring, first);
    // Both ends on one side (a lean-to drawn along one wall): there is nothing to follow.
    if (starts.length === 0 || ends.length === 0 || starts.some((side) => ends.includes(side)))
      continue;
    const ways = starts
      .flatMap((start) => ends.flatMap((end) => waysRound(ring, start, end)))
      .map((path) =>
        path.filter((at) => between(at, last) > ON_OUTLINE_M && between(at, first) > ON_OUTLINE_M),
      )
      .filter((path) => path.length > 0 && corners.length + path.length <= ROOF_CORNERS_MAX)
      .sort((a, b) => lengthOf(last, a, first) - lengthOf(last, b, first));
    // The roof closed along the wall stands beside the other, never over it.
    const way = ways.find(
      (path) => !edgesCross([...corners, ...path]) && !roofsOverlap([...corners, ...path], ring),
    );
    if (way !== undefined) return { owner, corners: way };
  }
  return null;
}
