import { edgeGone, frontSplit, phaseTurned } from './wavefront-changes';
import { type FrontEvent, nextEvent } from './wavefront-events';
import { lineThrough, type PlanPoint, SAME_TIME, type TimedPoint } from './wavefront-lines';
import {
  cornerOf,
  type FrontCorner,
  type FrontHalfEdge,
  type FrontPlane,
  type FrontRun,
  type FrontSide,
  join,
  lineOf,
  nodeAt,
  placeOf,
  ringOf,
  startPlane,
  steps,
  stepWall,
} from './wavefront-state';

/**
 * The wavefront run (`T-M05-002`, part e): an outline's sides move inward, each at its own speed
 * from its own time, and the front is followed from change to change until nothing is left of it,
 * or until a stop time. What it leaves behind is every face's edges; what is left standing at the
 * stop time is the outline moved in — a setback line, a wall's inner face, the walls under an
 * overhang.
 */

export interface FrontResult {
  readonly nodes: readonly TimedPoint[];
  readonly planes: readonly FrontPlane[];
  readonly halfEdges: readonly FrontHalfEdge[];
  /** The front left standing at the stop time, ring by ring. */
  readonly rings: readonly (readonly PlanPoint[])[];
  /** `false` when the front could not be followed to its end: the faces are not to be used. */
  readonly whole: boolean;
}

/** The front before anything moves: a corner wherever two sides of different lines meet. */
function startOf(
  loops: readonly (readonly PlanPoint[])[],
  sides: readonly (readonly FrontSide[])[],
): FrontRun | null {
  const run: FrontRun = {
    now: 0,
    lines: [],
    phases: [],
    phaseOf: [],
    planeOf: [],
    planes: [],
    nodes: [],
    halfEdges: [],
    live: new Set(),
  };
  for (const [l, loop] of loops.entries()) {
    const loopSides = sides[l] ?? [];
    if (loopSides.length !== loop.length || !linesOf(run, loop, loopSides)) return null;
  }
  for (const [l, loop] of loops.entries()) ringStart(run, loop, sides[l] ?? []);
  return run;
}

/** Each key's line and first plane, from the first side that carries the key. */
function linesOf(run: FrontRun, loop: readonly PlanPoint[], sides: readonly FrontSide[]): boolean {
  for (const [i, side] of sides.entries()) {
    if (run.lines[side.key] !== undefined) continue;
    const line = lineThrough(loop[i] as PlanPoint, loop[(i + 1) % loop.length] as PlanPoint);
    if (line === null) return false;
    run.lines[side.key] = line;
    run.phases[side.key] = side.phases;
    const started = side.phases.filter((phase) => phase.from <= 0).length - 1;
    startPlane(run, side.key, started);
  }
  return true;
}

/** One ring's corners and the first edge of each side's face. */
function ringStart(run: FrontRun, loop: readonly PlanPoint[], sides: readonly FrontSide[]): void {
  const count = loop.length;
  const nodes = loop.map((point) => nodeAt(run, point, 0));
  const corners: FrontCorner[] = [];
  for (let i = 0; i < count; i++) {
    const before = sides[(i - 1 + count) % count] as FrontSide;
    const after = sides[i] as FrontSide;
    const plane = run.planeOf[after.key] as number;
    const kind = lineOf(run, after.key).b === 0 ? 'wall' : 'eave';
    run.halfEdges.push({
      from: nodes[i] as number,
      to: nodes[(i + 1) % count] as number,
      plane,
      kind,
    });
    if (before.key === after.key) continue;
    corners.push(cornerOf(before.key, after.key, loop[i] as PlanPoint, nodes[i] as number));
  }
  corners.forEach((corner, i) => {
    join(corner, corners[(i + 1) % corners.length] as FrontCorner);
    run.live.add(corner);
  });
  for (const corner of corners) {
    if (steps(run, corner)) stepWall(run, corner, corner.born);
  }
}

function apply(run: FrontRun, event: FrontEvent): void {
  run.now = event.t;
  if (event.kind === 'phase') phaseTurned(run, event.key);
  else if (event.kind === 'edge') edgeGone(run, event);
  else frontSplit(run, event);
}

/** The front as it stands now, ring by ring. */
function ringsAt(run: FrontRun): PlanPoint[][] {
  const seen = new Set<FrontCorner>();
  const rings: PlanPoint[][] = [];
  for (const corner of run.live) {
    if (seen.has(corner)) continue;
    const ring = ringOf(corner);
    for (const each of ring) seen.add(each);
    rings.push(ring.map((each) => placeOf(run, each, run.now)));
  }
  return rings;
}

/** Changes allowed for each corner of the outline: far more than any real front makes. */
const CHANGES_PER_CORNER = 40;

/**
 * Follows the front of these loops — the outer ring anticlockwise, each hole clockwise — until
 * nothing is left, or until `until`. Every loop's sides are in the order of its points: side i
 * runs from point i to point i + 1.
 */
export function runFront(
  loops: readonly (readonly PlanPoint[])[],
  sides: readonly (readonly FrontSide[])[],
  until = Number.POSITIVE_INFINITY,
): FrontResult {
  const run = startOf(loops, sides);
  if (run === null) return { nodes: [], planes: [], halfEdges: [], rings: [], whole: false };
  const most = CHANGES_PER_CORNER * (run.live.size + run.lines.length + 1);
  let changes = 0;
  let event = nextEvent(run);
  while (event !== null && event.t <= until + SAME_TIME && changes < most) {
    apply(run, event);
    changes += 1;
    event = run.live.size === 0 && event.kind !== 'phase' ? null : nextEvent(run);
  }
  const stopped = Number.isFinite(until);
  if (stopped) run.now = Math.max(run.now, until);
  const whole = changes < most && (stopped || run.live.size === 0);
  return {
    nodes: run.nodes,
    planes: run.planes,
    halfEdges: run.halfEdges,
    rings: stopped ? ringsAt(run) : [],
    whole,
  };
}
