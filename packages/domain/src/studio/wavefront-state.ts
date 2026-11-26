import type { FaceEdgeKind } from './roof-scene';
import {
  crossingAt,
  distance,
  type MovingLine,
  PARALLEL,
  type PlanPoint,
  type TimedPoint,
  turnBetween,
} from './wavefront-lines';

/**
 * The wavefront as it stands at one time (`T-M05-002`, part e): rings of corners, each corner
 * between the side that ends at it and the side that starts at it, and what the front has left
 * behind — the points where it changed, and the edges of each side's face.
 */

/** What an edge of a face is (`roof-scene.ts`). */
export type FrontEdgeKind = FaceEdgeKind;

/** One side of an outline, as the front moves it. */
export interface FrontSide {
  /** Sides with one key lie on one line and move alike: they share one plane. */
  readonly key: number;
  /**
   * The side's speed from each time on, in the order of time. Before the first, it stands still:
   * a wall. A side with no phase never moves.
   */
  readonly phases: readonly { readonly from: number; readonly speed: number }[];
}

/** One stretch of one side's travel: a plane of the roof, or a standing wall. */
export interface FrontPlane {
  readonly key: number;
  /** The phase's place in the side's list; −1 while the side stands before its first phase. */
  readonly phase: number;
  readonly speed: number;
  /** The time this stretch began. */
  readonly from: number;
}

/** One edge of a plane's face, run with the face on its left. */
export interface FrontHalfEdge {
  readonly from: number;
  readonly to: number;
  readonly plane: number;
  readonly kind: FrontEdgeKind;
}

/** A corner of the front: between the side that ends here and the side that starts here. */
export interface FrontCorner {
  inKey: number;
  outKey: number;
  prev: FrontCorner;
  next: FrontCorner;
  alive: boolean;
  /** Where it was last known to stand: used while its two sides run the same way. */
  at: PlanPoint;
  /** The point its trail started at. */
  born: number;
}

export interface FrontRun {
  now: number;
  readonly lines: MovingLine[];
  readonly phases: FrontSide['phases'][];
  /** Each key's phase now, and its plane now. */
  readonly phaseOf: number[];
  readonly planeOf: number[];
  readonly planes: FrontPlane[];
  readonly nodes: TimedPoint[];
  readonly halfEdges: FrontHalfEdge[];
  readonly live: Set<FrontCorner>;
}

/** Two points of the front this close are one. */
const SAME_NODE_M = 1e-5;

/** The point of the front at a place and time: the one already there, or a new one. */
export function nodeAt(run: FrontRun, place: PlanPoint, t: number): number {
  const found = run.nodes.findIndex(
    (node) => Math.abs(node.t - t) < SAME_NODE_M && distance(node, place) < SAME_NODE_M,
  );
  if (found >= 0) return found;
  run.nodes.push({ x: place.x, y: place.y, t });
  return run.nodes.length - 1;
}

export function lineOf(run: FrontRun, key: number): MovingLine {
  return run.lines[key] as MovingLine;
}

/**
 * Where a corner stands at a time: where its two sides cross. Two sides that run the same way on
 * one line carry the corner with them, square to the line; two that face each other have met, and
 * the corner stands where they did.
 */
export function placeOf(run: FrontRun, corner: FrontCorner, t: number): PlanPoint {
  const line = lineOf(run, corner.inKey);
  const other = lineOf(run, corner.outKey);
  const crossing = crossingAt(line, other, t);
  if (crossing !== null) return crossing;
  if (line.nx * other.nx + line.ny * other.ny < 0) return corner.at;
  const moved = line.a + line.b * t - (line.nx * corner.at.x + line.ny * corner.at.y);
  return { x: corner.at.x + line.nx * moved, y: corner.at.y + line.ny * moved };
}

/**
 * Whether a corner stands between two sides on one line that move at different speeds: the front
 * steps there, and a standing wall joins the two (`stepWall`).
 */
export function steps(run: FrontRun, corner: FrontCorner): boolean {
  const line = lineOf(run, corner.inKey);
  const other = lineOf(run, corner.outKey);
  if (corner.inKey === corner.outKey || Math.abs(turnBetween(line, other)) >= PARALLEL)
    return false;
  return line.nx * other.nx + line.ny * other.ny > 0 && line.b !== other.b;
}

/**
 * A step in the front at a corner: a wall that stands still, square to the two sides, with a
 * corner at each end. The slower side's face ends at it, as a gable end does.
 */
export function stepWall(run: FrontRun, corner: FrontCorner, node: number): FrontCorner[] {
  const line = lineOf(run, corner.inKey);
  const at = run.nodes[node] as PlanPoint;
  // The wall's face is to the left of its way: its way runs from the slower side to the faster.
  const sign = lineOf(run, corner.outKey).b > line.b ? -1 : 1;
  const nx = sign * line.ny;
  const ny = -sign * line.nx;
  const key = run.lines.length;
  run.lines.push({ nx, ny, a: nx * at.x + ny * at.y, b: 0 });
  run.phases.push([]);
  run.phaseOf.push(-1);
  run.planeOf.push(run.planes.length);
  run.planes.push({ key, phase: -1, speed: 0, from: run.now });
  const first = cornerOf(corner.inKey, key, at, node);
  const second = cornerOf(key, corner.outKey, at, node);
  join(corner.prev, first);
  join(first, second);
  join(second, corner.next);
  retire(run, corner);
  run.live.add(first);
  run.live.add(second);
  return [first, second];
}

/** Whether the front turns inward at a corner: a corner that points into the roof. */
export function pointsInward(run: FrontRun, corner: FrontCorner): boolean {
  const turn = turnBetween(lineOf(run, corner.inKey), lineOf(run, corner.outKey));
  return turn < -PARALLEL;
}

/** What the trail of a corner is, between the two faces it parts. */
function trailKind(run: FrontRun, corner: FrontCorner, from: TimedPoint, to: TimedPoint) {
  const still = lineOf(run, corner.inKey).b === 0 || lineOf(run, corner.outKey).b === 0;
  if (still) return 'gable_end' as const;
  if (pointsInward(run, corner)) return 'valley' as const;
  return Math.abs(to.t - from.t) < SAME_NODE_M ? ('ridge' as const) : ('hip' as const);
}

/** A corner's trail ends at a point: one edge for the face of each of its two sides. */
export function endTrail(run: FrontRun, corner: FrontCorner, node: number): void {
  if (node === corner.born) return;
  const from = run.nodes[corner.born] as TimedPoint;
  const to = run.nodes[node] as TimedPoint;
  const kind = trailKind(run, corner, from, to);
  const inPlane = run.planeOf[corner.inKey] as number;
  const outPlane = run.planeOf[corner.outKey] as number;
  run.halfEdges.push({ from: corner.born, to: node, plane: inPlane, kind });
  run.halfEdges.push({ from: node, to: corner.born, plane: outPlane, kind });
}

/** A new corner of the front, not yet joined to its neighbours. */
export function cornerOf(inKey: number, outKey: number, at: PlanPoint, born: number): FrontCorner {
  const corner = { inKey, outKey, alive: true, at, born } as FrontCorner;
  corner.prev = corner;
  corner.next = corner;
  return corner;
}

/** Joins two corners: `second` follows `first` round the ring. */
export function join(first: FrontCorner, second: FrontCorner): void {
  first.next = second;
  second.prev = first;
}

export function retire(run: FrontRun, corner: FrontCorner): void {
  corner.alive = false;
  run.live.delete(corner);
}

/** The corners of the ring a corner is on, from it round to it. */
export function ringOf(corner: FrontCorner): FrontCorner[] {
  const ring = [corner];
  for (let at = corner.next; at !== corner && ring.length < MAX_RING; at = at.next) ring.push(at);
  return ring;
}

/** No ring is longer: a guard against a ring whose links were broken. */
const MAX_RING = 100_000;

/** One side starts a new stretch of its travel now: it moves on at the new speed, as a new plane. */
export function startPlane(run: FrontRun, key: number, phase: number): void {
  const speed = phase < 0 ? 0 : ((run.phases[key] ?? [])[phase]?.speed ?? 0);
  const line = lineOf(run, key);
  // The line stands where it is now and moves on at the new speed.
  line.a = line.a + line.b * run.now - speed * run.now;
  line.b = speed;
  run.phaseOf[key] = phase;
  run.planeOf[key] = run.planes.length;
  run.planes.push({ key, phase, speed, from: run.now });
}
