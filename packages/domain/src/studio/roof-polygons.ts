import polygonClipping, { type MultiPolygon, type Pair, type Polygon } from 'polygon-clipping';
import type { GroundPoint } from './ground';
import { type PlanPoint, ringArea } from './wavefront-lines';

/**
 * Roofs as flat shapes (`T-M05-002`, part e): joined, cut out of each other and laid over each
 * other. The shape maths is a proven library's, hidden here; this file adds what the studio
 * needs round it — roofs drawn by hand whose edges are meant to meet, and do within 0.3 m.
 */

/** A flat shape: its outer ring, and the holes in it. */
export interface FlatShape {
  readonly outer: readonly GroundPoint[];
  readonly holes: readonly (readonly GroundPoint[])[];
}

/** Edges within this of each other count as met, in metres. */
export const MET_M = 0.3;
/** `MET_M` with room for a sum's last digit: a roof drawn 0.3 m off is met. */
const MET_REACH_M = MET_M + 1e-9;
/** A sliver smaller than this is no shape, in square metres. */
const NO_SHAPE_M2 = 1e-4;

const pairOf = (point: GroundPoint): Pair => [point.east, point.north];
const pointOf = ([east, north]: Pair): GroundPoint => ({ east, north });
const planOf = (point: GroundPoint): PlanPoint => ({ x: point.east, y: point.north });

const polygonOf = (shape: FlatShape): Polygon => [
  shape.outer.map(pairOf),
  ...shape.holes.map((hole) => hole.map(pairOf)),
];

/** A ring as the studio holds it: no closing corner, and none said twice. */
function ringOf(ring: readonly Pair[]): GroundPoint[] {
  const points = ring.map(pointOf);
  const first = points[0];
  const last = points.at(-1);
  const closed =
    first !== undefined &&
    last !== undefined &&
    first.east === last.east &&
    first.north === last.north;
  return closed ? points.slice(0, -1) : points;
}

function shapesOf(found: MultiPolygon): FlatShape[] {
  return found
    .map((polygon) => ({
      outer: ringOf(polygon[0] ?? []),
      holes: polygon.slice(1).map(ringOf),
    }))
    .filter((shape) => shapeArea(shape) > NO_SHAPE_M2);
}

/** A ring's area, whichever way it runs, in square metres. */
export function ringAreaM2(ring: readonly GroundPoint[]): number {
  return Math.abs(ringArea(ring.map(planOf)));
}

export function shapeArea(shape: FlatShape): number {
  return ringAreaM2(shape.outer) - shape.holes.reduce((sum, hole) => sum + ringAreaM2(hole), 0);
}

export function shapesArea(shapes: readonly FlatShape[]): number {
  return shapes.reduce((sum, shape) => sum + shapeArea(shape), 0);
}

export const shapeOf = (outer: readonly GroundPoint[]): FlatShape => ({ outer, holes: [] });

type Operation = (
  subject: Polygon | MultiPolygon,
  ...others: (Polygon | MultiPolygon)[]
) => MultiPolygon;

/** One operation over shapes; a shape the library cannot resolve answers `null`, never a throw. */
function operated(
  operation: Operation,
  subject: readonly FlatShape[],
  others: readonly FlatShape[],
): FlatShape[] | null {
  if (subject.length === 0) return [];
  try {
    return shapesOf(operation(subject.map(polygonOf), others.map(polygonOf)));
  } catch {
    return null;
  }
}

/** Everything either set covers. */
export function joined(a: readonly FlatShape[], b: readonly FlatShape[]): FlatShape[] | null {
  if (a.length === 0) return [...b];
  return operated(polygonClipping.union, a, b);
}

/** Everything a set of shapes covers, joined in one pass. */
export function joinedAll(shapes: readonly FlatShape[]): FlatShape[] | null {
  const [first, ...rest] = shapes;
  if (first === undefined) return [];
  try {
    return shapesOf(polygonClipping.union(polygonOf(first), ...rest.map(polygonOf)));
  } catch {
    return null;
  }
}

/** What both sets cover. */
export function shared(a: readonly FlatShape[], b: readonly FlatShape[]): FlatShape[] | null {
  if (b.length === 0) return [];
  return operated(polygonClipping.intersection, a, b);
}

/** What the first set covers and the second does not. */
export function without(a: readonly FlatShape[], b: readonly FlatShape[]): FlatShape[] | null {
  if (b.length === 0) return [...a];
  return operated(polygonClipping.difference, a, b);
}

/** The nearest point of a segment to a point, and how far it is. */
function nearestOn(point: GroundPoint, from: GroundPoint, to: GroundPoint) {
  const dx = to.east - from.east;
  const dy = to.north - from.north;
  const span = dx * dx + dy * dy;
  const along =
    span === 0 ? 0 : ((point.east - from.east) * dx + (point.north - from.north) * dy) / span;
  const share = Math.min(1, Math.max(0, along));
  const at = { east: from.east + dx * share, north: from.north + dy * share };
  return { at, share, far: Math.hypot(point.east - at.east, point.north - at.north) };
}

/** A corner moved onto another roof where it lies within `MET_M` of it: its corner first, else its edge. */
function metPoint(point: GroundPoint, onto: readonly GroundPoint[]): GroundPoint {
  const corner = onto.find(
    (other) => Math.hypot(other.east - point.east, other.north - point.north) <= MET_REACH_M,
  );
  if (corner !== undefined) return corner;
  let best: { at: GroundPoint; far: number } | null = null;
  onto.forEach((from, i) => {
    const near = nearestOn(point, from, onto[(i + 1) % onto.length] as GroundPoint);
    if (near.far <= MET_REACH_M && (best === null || near.far < best.far)) best = near;
  });
  return (best as { at: GroundPoint } | null)?.at ?? point;
}

/**
 * A roof's outline with each corner that lies within 0.3 m of another roof moved onto it, so two
 * roofs drawn by hand to meet do meet: no sliver between them, and no strip of one over the other.
 */
export function metWith(ring: readonly GroundPoint[], onto: readonly GroundPoint[]): GroundPoint[] {
  const moved = ring.map((point) => metPoint(point, onto));
  // Two corners moved onto one place are one corner.
  return moved.filter((point, i) => {
    const before = moved[(i - 1 + moved.length) % moved.length] as GroundPoint;
    return moved.length <= 3 || point.east !== before.east || point.north !== before.north;
  });
}

/** Whether two sets of points lie too far apart to meet: their boxes are more than `MET_M` apart. */
export function farApart(one: readonly GroundPoint[], other: readonly GroundPoint[]): boolean {
  const reach = (points: readonly GroundPoint[], pick: (point: GroundPoint) => number) => {
    const values = points.map(pick);
    return [Math.min(...values) - MET_REACH_M, Math.max(...values) + MET_REACH_M] as const;
  };
  const east = (point: GroundPoint) => point.east;
  const north = (point: GroundPoint) => point.north;
  const [west, eastmost] = reach(one, east);
  const [south, northmost] = reach(one, north);
  const [otherWest, otherEast] = reach(other, east);
  const [otherSouth, otherNorth] = reach(other, north);
  return otherWest > eastmost || otherEast < west || otherSouth > northmost || otherNorth < south;
}

/** One stretch of a side: from one share of its length to another, 0 at its first corner. */
export interface Stretch {
  readonly from: number;
  readonly to: number;
}

/** A stretch shorter than this share of its side is none. */
const NO_STRETCH = 1e-6;

/** Where along a side a point of it lies, as a share of the side; `null` when it is off the side. */
function shareOn(point: GroundPoint, from: GroundPoint, to: GroundPoint): number | null {
  const near = nearestOn(point, from, to);
  return near.far <= MET_REACH_M ? near.share : null;
}

/** Whether a point lies inside a ring, its edge left out. */
function inside(point: GroundPoint, ring: readonly GroundPoint[]): boolean {
  let within = false;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length] as GroundPoint;
    const spans = a.north > point.north !== b.north > point.north;
    if (!spans) return;
    const eastAt = a.east + ((point.north - a.north) / (b.north - a.north)) * (b.east - a.east);
    if (point.east < eastAt) within = !within;
  });
  return within;
}

/** How far a point lies from a ring's edge, in metres. */
export function farFromEdge(point: GroundPoint, ring: readonly GroundPoint[]): number {
  return Math.min(
    ...ring.map(
      (from, i) => nearestOn(point, from, ring[(i + 1) % ring.length] as GroundPoint).far,
    ),
  );
}

/** Whether a point lies on a ring's edge, or within `MET_M` of it. */
function onEdge(point: GroundPoint, ring: readonly GroundPoint[]): boolean {
  return farFromEdge(point, ring) <= MET_REACH_M;
}

/**
 * The stretches of a side that another roof takes: where the side runs along that roof's edge,
 * within 0.3 m, or under the roof. The side splits exactly where the other roof starts and ends.
 */
export function stretchesTaken(
  from: GroundPoint,
  to: GroundPoint,
  other: readonly GroundPoint[],
): Stretch[] {
  if (farApart([from, to], other)) return [];
  const cuts = new Set<number>([0, 1]);
  other.forEach((corner, i) => {
    const share = shareOn(corner, from, to);
    if (share !== null) cuts.add(share);
    const crossing = crossingShare(from, to, corner, other[(i + 1) % other.length] as GroundPoint);
    if (crossing !== null) cuts.add(crossing);
  });
  const shares = [...cuts].sort((a, b) => a - b);
  const taken: Stretch[] = [];
  for (let i = 0; i + 1 < shares.length; i++) {
    const start = shares[i] as number;
    const end = shares[i + 1] as number;
    if (end - start < NO_STRETCH) continue;
    const middle = (start + end) / 2;
    const at = {
      east: from.east + (to.east - from.east) * middle,
      north: from.north + (to.north - from.north) * middle,
    };
    if (!onEdge(at, other) && !inside(at, other)) continue;
    const last = taken.at(-1);
    if (last !== undefined && start - last.to < NO_STRETCH)
      taken[taken.length - 1] = { from: last.from, to: end };
    else taken.push({ from: start, to: end });
  }
  return taken;
}

/** Where a side is crossed by another segment, as a share of the side; `null` when it is not. */
function crossingShare(
  from: GroundPoint,
  to: GroundPoint,
  a: GroundPoint,
  b: GroundPoint,
): number | null {
  const rx = to.east - from.east;
  const ry = to.north - from.north;
  const sx = b.east - a.east;
  const sy = b.north - a.north;
  const det = rx * sy - ry * sx;
  if (Math.abs(det) < NO_STRETCH) return null;
  const t = ((a.east - from.east) * sy - (a.north - from.north) * sx) / det;
  const u = ((a.east - from.east) * ry - (a.north - from.north) * rx) / det;
  return t > 0 && t < 1 && u >= 0 && u <= 1 ? t : null;
}
