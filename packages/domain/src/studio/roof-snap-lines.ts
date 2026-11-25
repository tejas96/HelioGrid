import type { GroundPoint } from './ground';
import { between, nearestOnSegment } from './roof-shape';
import {
  CROSS_MIN_DEGREES,
  type Guide,
  guideOf,
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
  return lineCross(a.guide.through, a.guide.way, b.guide.through, b.guide.way);
}

/** Two lines that are one: the same way and through the same place, to a millimetre. */
function sameLine(a: SnapLine, b: SnapLine): boolean {
  return linesAngle(a.guide.way, b.guide.way) < 0.01 && offLine(b.guide.through, a) <= ON_WALL_M;
}

/**
 * The walls of the design's other roofs, each as the line it runs on, right across the map: walls
 * on one line make one line that keeps every one of them, named for the first.
 */
export function wallLinesOf(targets: SnapTargets): SnapLine[] {
  const lines: SnapLine[] = [];
  for (const edge of targets.edges) {
    if (between(edge.from, edge.to) === 0) continue;
    const wall: SnapWall = { from: edge.from, to: edge.to, owner: edge.owner };
    const line: SnapLine = {
      guide: guideOf(edge.from, unit(edge.from, edge.to)),
      hold: { kind: 'wall_line', owner: edge.owner },
      walls: [wall],
    };
    const kept = lines.findIndex((other) => sameLine(other, line));
    if (kept < 0) lines.push(line);
    else {
      const other = lines[kept] as SnapLine;
      lines[kept] = { ...other, walls: [...(other.walls ?? []), wall] };
    }
  }
  return lines;
}

/**
 * The lines through other roofs' corners, square and parallel to the roof in hand — only where
 * they are not a wall's line already: a wall through that corner within `SNAP_DEGREES` of the line
 * is the line a person means, so it holds instead. They count when the roofs are not square.
 */
export function cornerLinesOf(targets: SnapTargets, long: GroundPoint, walls: readonly SnapLine[]) {
  const lines: SnapLine[] = [];
  for (const corner of targets.corners) {
    const ownWalls = walls.filter(({ walls: on }) =>
      (on ?? []).some(
        ({ from, to }) =>
          between(from, corner.at) <= ON_WALL_M || between(to, corner.at) <= ON_WALL_M,
      ),
    );
    for (const way of [long, across(long)]) {
      if (ownWalls.some((wall) => linesAngle(wall.guide.way, way) <= SNAP_DEGREES)) continue;
      const line: SnapLine = {
        guide: { through: corner.at, way },
        hold: { kind: 'lines_up_with', owner: corner.owner },
      };
      if (![...walls, ...lines].some((kept) => sameLine(kept, line))) lines.push(line);
    }
  }
  return lines;
}

/** A spot on another roof's corner, else on the middle of its wall, when one lies within reach. */
export function snapToPoints(at: GroundPoint, targets: SnapTargets, reach: number): Snapped | null {
  let best: Snapped | null = null;
  let bestReach = reach;
  for (const corner of targets.corners) {
    const off = between(corner.at, at);
    if (off <= bestReach) {
      bestReach = off;
      best = { point: corner.at, snap: { kind: 'corner_of', owner: corner.owner }, guides: [] };
    }
  }
  if (best !== null) return best;
  for (const edge of targets.edges) {
    const middle = {
      east: (edge.from.east + edge.to.east) / 2,
      north: (edge.from.north + edge.to.north) / 2,
    };
    const off = between(middle, at);
    if (off <= bestReach) {
      bestReach = off;
      best = { point: middle, snap: { kind: 'middle_of', owner: edge.owner }, guides: [] };
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
      .map(({ line }) => ({ ...line.guide, soft: true }) as const),
  };
}

/**
 * The spot held on `first`, and where a second line within reach crosses it, the corner there.
 * `first` may be a hold of the magnet's own (square, a line-up), which is named first.
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
    if (corner !== null && between(corner, at) <= reach) {
      return {
        point: corner,
        snap: { kind: 'cross', first: first.snap, second: holdAt(other, corner) },
        guides: [first.line.guide, other.guide],
      };
    }
  }
  return { point: first.point, snap: first.snap, guides: [first.line.guide] };
}
