import type { GroundPoint } from './ground';
import { type PlanPoint, ringArea } from './wavefront-lines';

/**
 * A roof's outline made ready for its faces (`T-M05-002`, part e): corners on a straight line and
 * jogs under 0.3 m are merged — for the faces only, never for the walls — so a hand-drawn step in a
 * wall does not fold the roof over it. Each side of the outline left knows the sides it stands for.
 */

/** A jog shorter than this is no side of the roof, in metres. */
export const JOG_M = 0.3;
/** A corner that turns less than this is on a straight line: the sine of two degrees. */
const STRAIGHT = 0.035;
const FEWEST_CORNERS = 3;

interface Kept {
  readonly point: PlanPoint;
  /** The first side of the drawn outline that starts at or after this corner. */
  readonly side: number;
}

export interface FaceOutline {
  /** The corners left, anticlockwise for an outline and clockwise for a hole. */
  readonly points: readonly PlanPoint[];
  /**
   * For each side left, the drawn sides it stands for, in the outline's own numbering; the first
   * is the longest, whose settings it takes.
   */
  readonly sides: readonly (readonly number[])[];
}

/** Whether two drawn sides are shaped alike: a straight corner between two that differ is kept. */
export type Alike = (side: number, other: number) => boolean;

const planOf = (point: GroundPoint): PlanPoint => ({ x: point.east, y: point.north });
const length = (a: PlanPoint, b: PlanPoint) => Math.hypot(b.x - a.x, b.y - a.y);

/** The shortest side under a jog's length, by the corner it starts at; `null` when none is. */
function shortestJog(kept: readonly Kept[]): number | null {
  let found: number | null = null;
  let shortest = JOG_M;
  kept.forEach((corner, i) => {
    const next = kept[(i + 1) % kept.length] as Kept;
    const span = length(corner.point, next.point);
    if (span < shortest) {
      shortest = span;
      found = i;
    }
  });
  return found;
}

/** Jogs merged, the shortest first: a jog's two corners become one at its middle. */
function withoutJogs(kept: readonly Kept[]): Kept[] {
  let left = [...kept];
  for (let jog = shortestJog(left); jog !== null && left.length > FEWEST_CORNERS; ) {
    const from = left[jog] as Kept;
    const to = left[(jog + 1) % left.length] as Kept;
    const middle = { x: (from.point.x + to.point.x) / 2, y: (from.point.y + to.point.y) / 2 };
    const merged: Kept = { point: middle, side: to.side };
    const drop = (jog + 1) % left.length;
    left = left.map((each, i) => (i === jog ? merged : each)).filter((_, i) => i !== drop);
    jog = shortestJog(left);
  }
  return left;
}

/** Whether the outline runs straight on through a corner. */
function straightAt(kept: readonly Kept[], i: number): boolean {
  const before = (kept[(i - 1 + kept.length) % kept.length] as Kept).point;
  const at = (kept[i] as Kept).point;
  const after = (kept[(i + 1) % kept.length] as Kept).point;
  const inLength = length(before, at);
  const outLength = length(at, after);
  if (inLength === 0 || outLength === 0) return true;
  const cross = (at.x - before.x) * (after.y - at.y) - (at.y - before.y) * (after.x - at.x);
  const along = (at.x - before.x) * (after.x - at.x) + (at.y - before.y) * (after.y - at.y);
  return along > 0 && Math.abs(cross) / (inLength * outLength) < STRAIGHT;
}

/** Corners on a straight line taken out, one at a time, where the sides either side are alike. */
function withoutStraights(kept: readonly Kept[], alike: Alike): Kept[] {
  let left = [...kept];
  for (let i = 0; i < left.length && left.length > FEWEST_CORNERS; ) {
    const before = (left[(i - 1 + left.length) % left.length] as Kept).side;
    if (straightAt(left, i) && alike(before, (left[i] as Kept).side)) {
      left = left.filter((_, at) => at !== i);
      i = 0;
    } else {
      i += 1;
    }
  }
  return left;
}

/** The drawn sides between two corners left, the longest first. */
function sidesBetween(drawn: readonly PlanPoint[], from: number, to: number): number[] {
  const count = drawn.length;
  const span: number[] = [];
  for (let side = from; span.length < count; side = (side + 1) % count) {
    if (side === to && span.length > 0) break;
    span.push(side);
  }
  const lengthOf = (side: number) =>
    length(drawn[side] as PlanPoint, drawn[(side + 1) % count] as PlanPoint);
  return span.sort((a, b) => lengthOf(b) - lengthOf(a));
}

/**
 * The outline its faces are built on. `hole` keeps a hole's corners clockwise; an outline's are
 * turned anticlockwise, and its sides keep the numbers they were drawn with. A corner on a straight
 * line stays where `alike` says the sides either side of it differ.
 */
export function outlineForFaces(
  corners: readonly GroundPoint[],
  hole = false,
  alike: Alike = () => true,
): FaceOutline {
  const drawn = corners.map(planOf);
  const jogless = withoutJogs(drawn.map((point, side) => ({ point, side })));
  const kept = withoutStraights(jogless, alike);
  const sides = kept.map((corner, i) =>
    sidesBetween(drawn, corner.side, (kept[(i + 1) % kept.length] as Kept).side),
  );
  const points = kept.map((corner) => corner.point);
  const anticlockwise = ringArea(points) > 0;
  if (anticlockwise !== hole) return { points, sides };
  // Turned round: side i then runs between the corners that were i + 1 and i.
  const turned = [...points].reverse();
  const turnedSides = turned.map(
    (_, i) => sides[(points.length - 2 - i + points.length) % points.length] as number[],
  );
  return { points: turned, sides: turnedSides };
}
