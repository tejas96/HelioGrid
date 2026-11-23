import {
  crossingAt,
  distance,
  meetingOf,
  type PlanPoint,
  SAME_TIME,
  wayOf,
} from './wavefront-lines';
import { type FrontCorner, type FrontRun, lineOf, placeOf, pointsInward } from './wavefront-state';

/**
 * What happens next to the wavefront (`T-M05-002`, part e). Three things change it: a side starts
 * a new stretch of its travel (a phase), an edge of the front shrinks to nothing (its two corners
 * meet), or a corner that points inward reaches another edge and splits the front. After each
 * change every candidate is worked out again from the front as it stands, so none goes stale.
 */

export type FrontEvent =
  | { readonly kind: 'phase'; readonly t: number; readonly key: number }
  | {
      readonly kind: 'edge';
      readonly t: number;
      readonly corner: FrontCorner;
      readonly at: PlanPoint;
    }
  | {
      readonly kind: 'split';
      readonly t: number;
      readonly corner: FrontCorner;
      /** The edge reached runs from this corner to its next. */
      readonly edge: FrontCorner;
      readonly at: PlanPoint;
    };

/** A point this far past an edge's end is still on it, in metres. */
const ON_EDGE_M = 1e-6;
/** An edge's end this many times farther from a meeting point is not at it. */
const FAR = 100;
/** An edge that changes length by less than this each unit of time is not shrinking. */
const SHRINKS = 1e-9;

const dot = (a: PlanPoint, b: PlanPoint) => a.x * b.x + a.y * b.y;
const minus = (a: PlanPoint, b: PlanPoint) => ({ x: a.x - b.x, y: a.y - b.y });

/** Whether the edge after a corner is getting shorter: one that grows from nothing is no event. */
function shrinks(run: FrontRun, corner: FrontCorner, t: number): boolean {
  const edge = lineOf(run, corner.outKey);
  const from = crossingAt(lineOf(run, corner.inKey), edge, t + 1);
  const to = crossingAt(edge, lineOf(run, corner.next.outKey), t + 1);
  if (from === null || to === null) return true;
  return dot(minus(to, from), wayOf(edge)) < -SHRINKS;
}

/** The edge after `corner` shrinks to nothing: its two corners meet. */
function edgeEvent(run: FrontRun, corner: FrontCorner): FrontEvent | null {
  const after = corner.next;
  if (after === corner || after.next === corner) return null;
  // An edge between two edges of one line has both its ends where that line crosses it: it has
  // no length, now or later, and goes at once.
  if (corner.inKey === after.outKey) {
    return { kind: 'edge', t: run.now, corner, at: placeOf(run, corner, run.now) };
  }
  const hit = meetingOf(
    lineOf(run, corner.inKey),
    lineOf(run, corner.outKey),
    lineOf(run, after.outKey),
  );
  if (hit === null || hit.t < run.now - SAME_TIME || !shrinks(run, corner, hit.t)) return null;
  // Both ends of the edge must be there: three lines can pass through a point the edge is not at
  // when two of them lie on each other.
  const ends = [corner, after].map((each) => placeOf(run, each, hit.t));
  if (ends.some((end) => distance(end, hit) > ON_EDGE_M * FAR)) return null;
  return { kind: 'edge', t: Math.max(hit.t, run.now), corner, at: hit };
}

/** Whether an edge is one a corner can reach: not one beside it, nor on a line of its own. */
function reachable(corner: FrontCorner, edge: FrontCorner): boolean {
  if (edge === corner || edge === corner.prev || edge === corner.next) return false;
  if (edge.next === corner.prev) return false;
  return edge.outKey !== corner.inKey && edge.outKey !== corner.outKey;
}

/** A corner that points inward reaches the edge after `edge`, between that edge's two ends. */
function splitEvent(run: FrontRun, corner: FrontCorner, edge: FrontCorner): FrontEvent | null {
  if (!reachable(corner, edge)) return null;
  const line = lineOf(run, edge.outKey);
  const hit = meetingOf(lineOf(run, corner.inKey), lineOf(run, corner.outKey), line);
  if (hit === null || hit.t < run.now - SAME_TIME) return null;
  const from = placeOf(run, edge, hit.t);
  const way = wayOf(line);
  const along = dot(minus(hit, from), way);
  const span = dot(minus(placeOf(run, edge.next, hit.t), from), way);
  if (along < -ON_EDGE_M || along > span + ON_EDGE_M) return null;
  return { kind: 'split', t: Math.max(hit.t, run.now), corner, edge, at: hit };
}

/** The next phase of each side that has one. */
function phaseEvents(run: FrontRun): FrontEvent[] {
  return run.phases.flatMap((phases, key) => {
    const next = phases[(run.phaseOf[key] as number) + 1];
    return next === undefined
      ? []
      : [{ kind: 'phase' as const, t: Math.max(next.from, run.now), key }];
  });
}

/** At one time a phase comes first, then an edge, then a split. */
const ORDER: Record<FrontEvent['kind'], number> = { phase: 0, edge: 1, split: 2 };

function sooner(one: FrontEvent, other: FrontEvent | null): boolean {
  if (other === null || one.t < other.t - SAME_TIME) return true;
  return one.t <= other.t + SAME_TIME && ORDER[one.kind] < ORDER[other.kind];
}

/** The next change to the front; `null` when nothing more can happen. */
export function nextEvent(run: FrontRun): FrontEvent | null {
  let best: FrontEvent | null = null;
  const take = (event: FrontEvent | null) => {
    if (event !== null && sooner(event, best)) best = event;
  };
  phaseEvents(run).forEach(take);
  const corners = [...run.live];
  for (const corner of corners) {
    take(edgeEvent(run, corner));
    if (!pointsInward(run, corner)) continue;
    for (const edge of corners) take(splitEvent(run, corner, edge));
  }
  return best;
}
