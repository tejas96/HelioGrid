import type { GroundPoint } from './ground';
import type { HoleFit } from './roof-meeting';
import { farFromEdge, MET_M, metWith, shapeOf, without } from './roof-polygons';
import { pointInside, roofMiddle } from './roof-shape';

/**
 * How a hole fits the roof it is cut in (`T-M05-002`, part e, E015). A hole clear inside cuts its
 * roof; one that runs along the roof's edge is no hole but a notch, so the roof's outline takes it
 * instead; one that touches the edge at a corner alone would leave a sliver of roof between two
 * points, so it moves clear of the edge.
 */

/** Room for a sum's last digit, in metres. */
const SUM_SLACK_M = 1e-9;
/** How far a hole moved clear stands from its roof's edge, in metres: past the reach of a meet. */
const CLEAR_M = MET_M + 0.05;
/** Each try moves a hole this much further, in metres. */
const NUDGE_M = 0.05;

/** How a hole meets the roof it is drawn in: clear inside, along its edge, or at a corner alone. */
export type HoleMeets = 'inside' | 'on_edge' | 'corner_only';

/**
 * How a hole meets its roof's edge. One that runs along the edge changes the outline instead of
 * cutting a hole; one that touches at a corner alone is moved clear of it.
 */
export function holeMeets(roof: readonly GroundPoint[], hole: readonly GroundPoint[]): HoleMeets {
  const near = (point: GroundPoint) => farFromEdge(point, roof) <= MET_M + SUM_SLACK_M;
  const alongEdge = hole.some((corner, i) => {
    const next = hole[(i + 1) % hole.length] as GroundPoint;
    const middle = { east: (corner.east + next.east) / 2, north: (corner.north + next.north) / 2 };
    return near(corner) && near(next) && near(middle);
  });
  if (alongEdge) return 'on_edge';
  return hole.some(near) ? 'corner_only' : 'inside';
}

/** The roof's outline with the hole taken out of its edge: one piece with no hole, else `null`. */
function notched(roof: readonly GroundPoint[], hole: readonly GroundPoint[]) {
  // A hole drawn just short of the edge reaches it: no strip of roof is left outside it.
  const left = without([shapeOf(roof)], [shapeOf(metWith(hole, roof))]) ?? [];
  const [piece, ...more] = left;
  return piece === undefined || more.length > 0 || piece.holes.length > 0 ? null : piece.outer;
}

/**
 * The hole moved clear of the edge it touches at a corner: away from the corners that touch it,
 * towards its own middle, just far enough that every corner stands clear inside the roof; `null`
 * where the roof leaves it no room.
 */
function movedClear(
  roof: readonly GroundPoint[],
  hole: readonly GroundPoint[],
): GroundPoint[] | null {
  const touching = hole.filter((point) => farFromEdge(point, roof) <= MET_M + SUM_SLACK_M);
  const from = roofMiddle(touching);
  const to = roofMiddle(hole);
  const length = Math.hypot(to.east - from.east, to.north - from.north);
  if (length === 0) return null;
  const way = { east: (to.east - from.east) / length, north: (to.north - from.north) / length };
  const reach = Math.max(
    ...hole.map((a) =>
      Math.max(...hole.map((b) => Math.hypot(a.east - b.east, a.north - b.north))),
    ),
  );
  for (let by = NUDGE_M; by <= reach + CLEAR_M; by += NUDGE_M) {
    const moved = hole.map((point) => ({
      east: point.east + way.east * by,
      north: point.north + way.north * by,
    }));
    const clear = moved.every(
      (point) => pointInside(point, roof) && farFromEdge(point, roof) >= CLEAR_M,
    );
    // Its corners inside is not enough on an L or a U: none of it may lie past the roof's edge,
    // and a shape the library could not work out is no proof that none does.
    const past = clear ? without([shapeOf(moved)], [shapeOf(roof)]) : null;
    if (past !== null && past.length === 0) return moved;
  }
  return null;
}

/** How a hole fits its roof: as it is, as a notch in the roof's outline, or moved clear. */
export function holeFitOf(roof: readonly GroundPoint[], hole: readonly GroundPoint[]): HoleFit {
  const meets = holeMeets(roof, hole);
  if (meets === 'on_edge') {
    const outline = notched(roof, hole);
    return outline === null ? { kind: 'inside' } : { kind: 'notch', outline };
  }
  if (meets === 'corner_only') {
    const corners = movedClear(roof, hole);
    return corners === null ? { kind: 'inside' } : { kind: 'moved', corners };
  }
  return { kind: 'inside' };
}
