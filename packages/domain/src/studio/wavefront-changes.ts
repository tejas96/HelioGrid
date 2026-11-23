import type { FrontEvent } from './wavefront-events';
import { distance, PARALLEL, SAME_PLACE_M, turnBetween } from './wavefront-lines';
import {
  cornerOf,
  endTrail,
  type FrontCorner,
  type FrontRun,
  join,
  lineOf,
  nodeAt,
  placeOf,
  retire,
  ringOf,
  startPlane,
  steps,
  stepWall,
} from './wavefront-state';

/**
 * The changes to a wavefront (`T-M05-002`, part e): an edge that shrinks to nothing, a corner that
 * reaches another edge, a side that starts a new stretch of its travel — and what follows each: a
 * ring with no room left closes, and a fold in the front is folded away.
 */

/** A ring of one or two corners has no room left: its corners end, and its two edges are a ridge. */
function closeIfDone(run: FrontRun, corner: FrontCorner): void {
  if (!corner.alive) return;
  const ring = ringOf(corner);
  if (ring.length > 2) return;
  const nodes = ring.map((each) => nodeAt(run, placeOf(run, each, run.now), run.now));
  ring.forEach((each, i) => {
    endTrail(run, each, nodes[i] as number);
  });
  ring.forEach((each, i) => {
    const from = nodes[i] as number;
    const to = nodes[(i + 1) % ring.length] as number;
    // The edge after this corner is its side's last: the face's top, run backwards.
    if (from !== to) {
      run.halfEdges.push({
        from: to,
        to: from,
        plane: run.planeOf[each.outKey] as number,
        kind: 'ridge',
      });
    }
  });
  for (const each of ring) retire(run, each);
}

/** Whether a corner's two sides face each other on one line: they have met, and the front folds here. */
function folded(run: FrontRun, corner: FrontCorner): boolean {
  const line = lineOf(run, corner.inKey);
  const other = lineOf(run, corner.outKey);
  return (
    Math.abs(turnBetween(line, other)) < PARALLEL && line.nx * other.nx + line.ny * other.ny < 0
  );
}

/**
 * A fold in the front: the edge into a corner and the edge out of it lie on each other. The shorter
 * of the two is gone, with as much of the longer, and what they covered is a ridge between their
 * two planes. The front goes on from the far end of the shorter edge.
 */
function fold(run: FrontRun, tip: FrontCorner): void {
  const before = tip.prev;
  const after = tip.next;
  const tipNode = nodeAt(run, tip.at, run.now);
  const beforeAt = placeOf(run, before, run.now);
  const afterAt = placeOf(run, after, run.now);
  const reach = distance(beforeAt, tip.at) - distance(afterAt, tip.at);
  const even = Math.abs(reach) < SAME_PLACE_M * FOLD_SLACK;
  const endsBefore = even || reach < 0;
  const endsAfter = even || reach > 0;
  const endAt = endsBefore ? beforeAt : afterAt;
  const endNode = nodeAt(run, endAt, run.now);
  endTrail(run, tip, tipNode);
  if (endsBefore) endTrail(run, before, endNode);
  if (endsAfter) endTrail(run, after, endNode);
  if (endNode !== tipNode) {
    run.halfEdges.push({
      from: tipNode,
      to: endNode,
      plane: run.planeOf[tip.inKey] as number,
      kind: 'ridge',
    });
    run.halfEdges.push({
      from: endNode,
      to: tipNode,
      plane: run.planeOf[tip.outKey] as number,
      kind: 'ridge',
    });
  }
  const merged = cornerOf(
    endsBefore ? before.inKey : tip.inKey,
    endsAfter ? after.outKey : tip.outKey,
    endAt,
    endNode,
  );
  join(endsBefore ? before.prev : before, merged);
  join(merged, endsAfter ? after.next : after);
  retire(run, tip);
  if (endsBefore) retire(run, before);
  if (endsAfter) retire(run, after);
  run.live.add(merged);
  settle(run, merged, endNode);
}

/** Two reaches of a fold this many places apart are even. */
const FOLD_SLACK = 10;

/**
 * A new corner settled: one that stands between two edges of one line is no corner (the two edges
 * are one), one where the front steps gets its wall, and one where it folds is folded. A ring with
 * no room left closes.
 */
export function settle(run: FrontRun, corner: FrontCorner, node: number): void {
  if (corner.inKey === corner.outKey) {
    endTrail(run, corner, node);
    const after = corner.next;
    join(corner.prev, after);
    retire(run, corner);
    closeIfDone(run, after);
    return;
  }
  const ends = steps(run, corner) ? stepWall(run, corner, node) : [corner];
  const first = ends[0] as FrontCorner;
  closeIfDone(run, first);
  if (first.alive && folded(run, first)) fold(run, first);
}

/** An edge shrinks to nothing: its two corners become one, between the sides either side of it. */
export function edgeGone(run: FrontRun, event: Extract<FrontEvent, { kind: 'edge' }>): void {
  const first = event.corner;
  const second = first.next;
  const node = nodeAt(run, event.at, run.now);
  endTrail(run, first, node);
  endTrail(run, second, node);
  const merged = cornerOf(first.inKey, second.outKey, event.at, node);
  join(first.prev, merged);
  join(merged, second.next);
  retire(run, first);
  retire(run, second);
  run.live.add(merged);
  settle(run, merged, node);
}

/** A corner reaches an edge: the front splits there, one new corner on each side of it. */
export function frontSplit(run: FrontRun, event: Extract<FrontEvent, { kind: 'split' }>): void {
  const { corner, edge } = event;
  const edgeEnd = edge.next;
  const node = nodeAt(run, event.at, run.now);
  endTrail(run, corner, node);
  const left = cornerOf(corner.inKey, edge.outKey, event.at, node);
  const right = cornerOf(edge.outKey, corner.outKey, event.at, node);
  join(corner.prev, left);
  join(left, edgeEnd);
  join(edge, right);
  join(right, corner.next);
  retire(run, corner);
  run.live.add(left);
  run.live.add(right);
  settle(run, left, node);
  settle(run, right, node);
}

/**
 * A side starts a new stretch: each corner on it turns a new way, so its trail ends and starts
 * again here, and each edge of the side is the top of its old plane's face and the foot of its new.
 */
export function phaseTurned(run: FrontRun, key: number): void {
  const onSide = [...run.live].filter((corner) => corner.inKey === key || corner.outKey === key);
  const nodes = new Map<FrontCorner, number>();
  for (const corner of onSide) {
    const place = placeOf(run, corner, run.now);
    const node = nodeAt(run, place, run.now);
    endTrail(run, corner, node);
    corner.born = node;
    corner.at = place;
    nodes.set(corner, node);
  }
  const old = run.planeOf[key] as number;
  const stood = lineOf(run, key).b === 0;
  startPlane(run, key, (run.phaseOf[key] as number) + 1);
  const fresh = run.planeOf[key] as number;
  const kind = stood ? 'eave' : 'break';
  for (const corner of onSide) {
    const from = nodes.get(corner);
    const to = nodes.get(corner.next);
    if (corner.outKey !== key || from === undefined || to === undefined || from === to) continue;
    run.halfEdges.push({ from: to, to: from, plane: old, kind });
    run.halfEdges.push({ from, to, plane: fresh, kind });
  }
  // Two sides on one line that now move apart: the front steps between them.
  for (const corner of onSide) {
    if (corner.alive && steps(run, corner)) stepWall(run, corner, corner.born);
  }
}
