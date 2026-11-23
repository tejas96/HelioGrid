import type { Roof } from './document';
import type { GroundPoint } from './ground';
import type { RoofSide } from './roof-parts';
import { between, cornerAfter } from './roof-shape';

/**
 * A roof's side list kept right while its corners change (`T-M05-002`, part e): each side's own
 * settings stay on that side when a corner is added or removed, so a wall a person took off never
 * moves to its neighbour. A list that did not match the corners held nothing a reader would use,
 * and is dropped.
 */

/** The roof with these corners, edges and — where it holds a list that matches — sides. */
function withSides(
  roof: Roof,
  next: Pick<Roof, 'corners' | 'edges'>,
  sidesOf: (sides: readonly RoofSide[]) => readonly RoofSide[],
): Roof {
  const { sides, ...rest } = roof;
  if (sides === undefined) return { ...roof, ...next };
  if (sides.length !== roof.corners.length) return { ...rest, ...next };
  return { ...rest, ...next, sides: sidesOf(sides) };
}

/** A side's settings without the marks only one side carries: the low side, the glass, the stairs. */
function plain(side: RoofSide): RoofSide {
  const { low: _l, glass: _g, stairsAt: _a, stairsBy: _b, ...values } = side;
  return values;
}

/**
 * A corner added on side `edge`, at `at`: the side becomes two, and both keep its settings. The
 * marks one side alone carries stay on the first half; the stairs go with the half they stand on.
 */
export function roofWithCorner(
  roof: Roof,
  edge: number,
  at: GroundPoint,
  next: Pick<Roof, 'corners' | 'edges'>,
): Roof {
  return withSides(roof, next, (sides) => {
    const side = sides[edge] ?? {};
    const firstHalf = between(roof.corners[edge] as GroundPoint, at);
    const { stairsAt, stairsBy, ...first } = side;
    const onSecond = stairsAt !== undefined && stairsAt > firstHalf;
    const halves: RoofSide[] = onSecond
      ? [first, { ...plain(side), stairsAt: stairsAt - firstHalf, stairsBy }]
      : [side, plain(side)];
    return [...sides.slice(0, edge), ...halves, ...sides.slice(edge + 1)];
  });
}

/** How far along the joined side a point of the two old sides lies, kept on the side. */
function alongJoined(point: GroundPoint, from: GroundPoint, to: GroundPoint): number {
  const dx = to.east - from.east;
  const dy = to.north - from.north;
  const length = Math.hypot(dx, dy);
  if (length === 0) return 0;
  const along = ((point.east - from.east) * dx + (point.north - from.north) * dy) / length;
  return Math.min(Math.max(along, 0), length);
}

/** The point a distance along a side, from its first corner. */
function pointAlong(from: GroundPoint, to: GroundPoint, metres: number): GroundPoint {
  const length = Math.hypot(to.east - from.east, to.north - from.north) || 1;
  const share = metres / length;
  return {
    east: from.east + (to.east - from.east) * share,
    north: from.north + (to.north - from.north) * share,
  };
}

/** Where the stairs on either of two sides stand on the ground; `null` when neither carries them. */
function stairsStood(
  kept: RoofSide,
  gone: RoofSide,
  ends: readonly [GroundPoint, GroundPoint, GroundPoint],
): GroundPoint | null {
  const [start, middle, end] = ends;
  if (kept.stairsAt !== undefined) return pointAlong(start, middle, kept.stairsAt);
  return gone.stairsAt === undefined ? null : pointAlong(middle, end, gone.stairsAt);
}

/** The marks only one side carries, taken from the side that goes where the side kept has none. */
function marksJoined(kept: RoofSide, gone: RoofSide): RoofSide {
  const low = kept.low ?? gone.low;
  const glass = kept.glass ?? gone.glass;
  return { ...(low === undefined ? {} : { low }), ...(glass === undefined ? {} : { glass }) };
}

/**
 * Corner `corner` removed: the side before it and the side after it join as one, which keeps the
 * settings of the side before; a mark only the side after carried moves onto the joined side. The
 * stairs stay where they stood, as near as the joined side comes to that spot.
 */
export function roofWithoutCorner(
  roof: Roof,
  corner: number,
  next: Pick<Roof, 'corners' | 'edges'>,
): Roof {
  return withSides(roof, next, (sides) => {
    const count = sides.length;
    const before = (corner - 1 + count) % count;
    const kept = sides[before] ?? {};
    const gone = sides[corner] ?? {};
    const start = roof.corners[before] as GroundPoint;
    const end = cornerAfter(roof.corners, corner);
    const stood = stairsStood(kept, gone, [start, roof.corners[corner] as GroundPoint, end]);
    const { stairsAt: _at, stairsBy: _by, ...settings } = kept;
    const stairs =
      stood === null
        ? {}
        : { stairsAt: alongJoined(stood, start, end), stairsBy: kept.stairsBy ?? gone.stairsBy };
    const joined: RoofSide = { ...settings, ...marksJoined(kept, gone), ...stairs };
    return sides.map((side, i) => (i === before ? joined : side)).filter((_, i) => i !== corner);
  });
}

/**
 * A side's wall added or taken off by a person: that side says so from now on, whatever stands on
 * the roof or beside it, until its sheet hands it back to the studio. The other sides keep what
 * they hold.
 */
export function roofWithSideWall(roof: Roof, side: number, wall: boolean): Roof {
  if (side < 0 || side >= roof.corners.length) return roof;
  // A list that does not match the corners held nothing a reader would use: it starts afresh.
  const held =
    roof.sides?.length === roof.corners.length ? roof.sides : roof.corners.map(() => ({}));
  const sides = held.map((each, i): RoofSide => (i === side ? { ...each, parapet: wall } : each));
  return { ...roof, sides };
}
