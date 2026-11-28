import type { GroundPoint } from './ground';
import { between, nearestOnSegment } from './roof-shape';
import {
  CROSS_MIN_DEGREES,
  GHOST_CATCH_REACHES,
  type Guide,
  ON_WALL_M,
  type RoofHold,
  SNAP_DEGREES,
  SNAP_SOFT_REACHES,
  type SnapOwner,
  type Snapped,
  type SnapTargets,
} from './roof-snap';

/**
 * The lines the magnet holds a spot on (`T-M05-002`, part e): other roofs' walls right across the
 * map, the lines through their corners, and where two lines cross; with the plane geometry of a
 * line they are built on.
 */

/** The point where two lines cross: each through a point, running a way; `null` when parallel. */
export function lineCross(
  a: GroundPoint,
  aWay: GroundPoint,
  b: GroundPoint,
  bWay: GroundPoint,
): GroundPoint | null {
  const det = aWay.east * bWay.north - aWay.north * bWay.east;
  if (Math.abs(det) < 1e-9) return null;
  const t = ((b.east - a.east) * bWay.north - (b.north - a.north) * bWay.east) / det;
  return { east: a.east + aWay.east * t, north: a.north + aWay.north * t };
}

/** The nearest point on the line through `on`, running `way`. */
export function ontoLine(point: GroundPoint, on: GroundPoint, way: GroundPoint): GroundPoint {
  const reach = way.east * way.east + way.north * way.north;
  if (reach === 0) return on;
  const along = ((point.east - on.east) * way.east + (point.north - on.north) * way.north) / reach;
  return { east: on.east + way.east * along, north: on.north + way.north * along };
}

/** A wall of another roof that a line runs along, and whose it is. */
export interface SnapWall {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly owner: SnapOwner;
}

/**
 * A line a spot can be held on: its guide and what it is. `walls`: the other roofs' walls it runs
 * along — one line, however many roofs' walls lie on it — so a spot on a wall reads as on that
 * roof's edge, and past them as on the line. `only`: the spot is held only between the one wall's
 * ends (the inside of a parapet).
 */
export interface SnapLine {
  readonly guide: Guide;
  readonly hold: RoofHold;
  readonly walls?: readonly SnapWall[];
  readonly only?: true;
}

export function unit(from: GroundPoint, to: GroundPoint): GroundPoint {
  const reach = between(from, to) || 1;
  return { east: (to.east - from.east) / reach, north: (to.north - from.north) / reach };
}

export function dot(a: GroundPoint, b: GroundPoint): number {
  return a.east * b.east + a.north * b.north;
}

export function along(from: GroundPoint, way: GroundPoint, metres: number): GroundPoint {
  return { east: from.east + way.east * metres, north: from.north + way.north * metres };
}

/** Square to a way: a quarter turn. */
export const across = (way: GroundPoint): GroundPoint => ({ east: -way.north, north: way.east });

/** The angle between two lines, in degrees, from 0 to 90. */
function linesAngle(a: GroundPoint, b: GroundPoint): number {
  const cos =
    Math.abs(dot(a, b)) / ((Math.hypot(a.east, a.north) || 1) * (Math.hypot(b.east, b.north) || 1));
  return (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
}

/** How far a point is from a line, in metres. */
export function offLine(point: GroundPoint, line: SnapLine): number {
  return between(point, ontoLine(point, line.guide.through, line.guide.way));
}

/** Where a line holds a spot: its nearest point; on a wall-only line, only between the wall's ends. */
export function heldOn(point: GroundPoint, line: SnapLine): GroundPoint {
  const wall = line.only ? line.walls?.[0] : undefined;
  return wall === undefined
    ? ontoLine(point, line.guide.through, line.guide.way)
    : nearestOnSegment(point, wall.from, wall.to);
}

/** What a line names at a point on it: on a wall that lies on it, that roof's edge. */
export function holdAt(line: SnapLine, point: GroundPoint): RoofHold {
  if (line.hold.kind !== 'wall_line') return line.hold;
  const wall = line.walls?.find(
    ({ from, to }) => between(point, nearestOnSegment(point, from, to)) <= ON_WALL_M,
  );
  return wall === undefined ? line.hold : { kind: 'edge_of', owner: wall.owner };
}

/** The point where two lines cross, when they meet steeply enough to make a corner. */
export function linesCross(a: SnapLine, b: SnapLine): GroundPoint | null {
  if (linesAngle(a.guide.way, b.guide.way) < CROSS_MIN_DEGREES) return null;
  const point = lineCross(a.guide.through, a.guide.way, b.guide.through, b.guide.way);
  // A wall-only line crosses another only between its wall's ends.
  if (point === null || !onItsWall(point, a) || !onItsWall(point, b)) return null;
  return point;
}

/** Whether a point lies where a line holds: anywhere on it, or on a wall-only line's wall. */
export function onItsWall(point: GroundPoint, line: SnapLine): boolean {
  const wall = line.only ? line.walls?.[0] : undefined;
  return (
    wall === undefined ||
    between(point, nearestOnSegment(point, wall.from, wall.to)) <= CROSS_ON_WALL_M
  );
}

/** A crossing this near a wall-only line's wall lies on it. */
const CROSS_ON_WALL_M = 0.01;

/** Two lines a hundredth of a degree and a millimetre apart, or nearer, are one line. */
const SAME_RADIANS = (0.01 * Math.PI) / 180;

/**
 * A line as a key: its way, turned to point east (or north), as an angle, and how far it runs
 * from the ground's origin square to that way — each rounded, so two lines that are one share a
 * key. A key looks a line up at once: a site's lines are never compared pair by pair.
 */
function lineKey({ through, way }: Guide): string {
  const flip = way.east < 0 || (way.east === 0 && way.north < 0) ? -1 : 1;
  const east = way.east * flip;
  const north = way.north * flip;
  const offset = through.east * north - through.north * east;
  return `${Math.round(Math.atan2(north, east) / SAME_RADIANS)}|${Math.round(offset / ON_WALL_M)}`;
}

/** The spots a line must pass near to count, and how near, in metres. */
export interface Near {
  readonly points: readonly GroundPoint[];
  readonly within: number;
}

/**
 * Whether the line through `through`, running `way` (any length), passes within `near.within` of
 * one of its spots: squares only, no root, so a site of 200 roofs is narrowed to the few lines
 * that can matter before any line is worked out or compared with another.
 */
function passesNear(through: GroundPoint, way: GroundPoint, near: Near): boolean {
  const reach = near.within * near.within * (way.east * way.east + way.north * way.north);
  return near.points.some((point) => {
    const across =
      (point.east - through.east) * way.north - (point.north - through.north) * way.east;
    return across * across <= reach;
  });
}

/**
 * The walls of the design's other roofs that run near the spots, each as the line it runs on,
 * right across the map: walls on one line make one line that keeps every one of them, named for
 * the first.
 */
export function wallLinesOf(targets: SnapTargets, near: Near): SnapLine[] {
  const lines: SnapLine[] = [];
  const byKey = new Map<string, number>();
  for (const edge of targets.edges) {
    const run = { east: edge.to.east - edge.from.east, north: edge.to.north - edge.from.north };
    if ((run.east === 0 && run.north === 0) || !passesNear(edge.from, run, near)) continue;
    const way = unit(edge.from, edge.to);
    const wall: SnapWall = { from: edge.from, to: edge.to, owner: edge.owner };
    const line: SnapLine = {
      guide: { through: edge.from, way },
      hold: { kind: 'wall_line', owner: edge.owner },
      walls: [wall],
    };
    const key = lineKey(line.guide);
    const kept = byKey.get(key);
    if (kept === undefined) {
      byKey.set(key, lines.length);
      lines.push(line);
    } else {
      const other = lines[kept] as SnapLine;
      lines[kept] = { ...other, walls: [...(other.walls ?? []), wall] };
    }
  }
  return lines;
}

/**
 * The lines through other roofs' corners, square and parallel to the roof in hand, that run near
 * the spots — only where they are not a wall's line already: a wall at that corner within
 * `SNAP_DEGREES` of the line is the line a person means, so it holds instead. They count when the
 * roofs are not square.
 */
export function cornerLinesOf(
  targets: SnapTargets,
  long: GroundPoint,
  walls: readonly SnapLine[],
  near: Near,
): SnapLine[] {
  const lines: SnapLine[] = [];
  // A wall held only between its ends (a parapet's inside): a line along it past its ends is new.
  const known = new Set(walls.filter((wall) => !wall.only).map(({ guide }) => lineKey(guide)));
  for (const corner of targets.corners) {
    for (const way of [long, across(long)]) {
      if (!passesNear(corner.at, way, near)) continue;
      const ownWall = [corner.before, corner.after].some(
        (end) =>
          between(end, corner.at) > 0 && linesAngle(unit(end, corner.at), way) <= SNAP_DEGREES,
      );
      if (ownWall) continue;
      const line: SnapLine = {
        guide: { through: corner.at, way },
        hold: { kind: 'lines_up_with', owner: corner.owner },
      };
      const key = lineKey(line.guide);
      if (known.has(key)) continue;
      known.add(key);
      lines.push(line);
    }
  }
  return lines;
}

/** A spot on another roof's corner, else on the middle of its wall, when one lies within reach. */
export function snapToPoints(at: GroundPoint, targets: SnapTargets, reach: number): Snapped | null {
  // Squared distances: no root for the many points far from the spot.
  const square = (east: number, north: number) => (east - at.east) ** 2 + (north - at.north) ** 2;
  let best: Snapped | null = null;
  let bestReach = reach * reach;
  for (const corner of targets.corners) {
    const off = square(corner.at.east, corner.at.north);
    if (off <= bestReach) {
      bestReach = off;
      best = { point: corner.at, snap: { kind: 'corner_of', owner: corner.owner }, guides: [] };
    }
  }
  if (best !== null) return best;
  for (const edge of targets.edges) {
    const east = (edge.from.east + edge.to.east) / 2;
    const north = (edge.from.north + edge.to.north) / 2;
    const off = square(east, north);
    if (off <= bestReach) {
      bestReach = off;
      best = { point: { east, north }, snap: { kind: 'middle_of', owner: edge.owner }, guides: [] };
    }
  }
  return best;
}

/** The lines within reach of a spot, nearest first, and the ones a little further: drawn faint. */
export function linesNear(
  at: GroundPoint,
  lines: readonly SnapLine[],
  reach: number,
): { readonly near: SnapLine[]; readonly soft: Guide[] } {
  const scored = lines
    .map((line) => ({ line, off: between(at, heldOn(at, line)) }))
    .sort((a, b) => a.off - b.off);
  return {
    near: scored.filter(({ off }) => off <= reach).map(({ line }) => line),
    soft: scored
      .filter(({ off }) => off > reach && off <= reach * SNAP_SOFT_REACHES)
      // The nearest alone: more faint lines than one crowd the spot.
      .slice(0, 1)
      .map(({ line }) => ({ ...line.guide, soft: true }) as const),
  };
}

/**
 * The spot held on `first`; where a second line within reach crosses it, the corner there is a
 * ghost — taken only when the spot is on it, within `GHOST_CATCH_REACHES` of the reach. `first`
 * may be a hold of the magnet's own (square, a line-up), which is named first.
 */
export function crossedOrOn(
  at: GroundPoint,
  first: { readonly line: SnapLine; readonly point: GroundPoint; readonly snap: RoofHold },
  others: readonly SnapLine[],
  reach: number,
): Snapped {
  for (const other of others) {
    if (other === first.line) continue;
    const corner = linesCross(first.line, other);
    if (corner === null || between(corner, at) > reach) continue;
    const guides = [first.line.guide, other.guide];
    if (between(corner, at) <= reach * GHOST_CATCH_REACHES) {
      return {
        point: corner,
        snap: { kind: 'cross', first: first.snap, second: holdAt(other, corner) },
        guides,
      };
    }
    return { point: first.point, snap: first.snap, guides, ghost: corner };
  }
  return { point: first.point, snap: first.snap, guides: [first.line.guide] };
}
