import { type PlanPoint, ringArea } from './wavefront-lines';
import type { FrontResult } from './wavefront-run';
import type { FrontEdgeKind, FrontHalfEdge } from './wavefront-state';

/**
 * The faces a wavefront run leaves behind (`T-M05-002`, part e): each plane's edges, joined end to
 * end into the rings that bound its face. A plane swept in two places has two faces.
 */

/** One face: a ring of the run's points, anticlockwise, and what each of its edges is. */
export interface FrontFace {
  readonly plane: number;
  readonly ring: readonly number[];
  /** `kinds[i]` is the edge from `ring[i]` to `ring[i + 1]`. */
  readonly kinds: readonly FrontEdgeKind[];
}

/** A face smaller than this has no room on it: a wall seen from above, in square metres. */
const NO_AREA_M2 = 1e-6;

/** The turn from one way to the next: above zero to the left, from −π to π. */
function turn(from: PlanPoint, at: PlanPoint, to: PlanPoint): number {
  const ax = at.x - from.x;
  const ay = at.y - from.y;
  const bx = to.x - at.x;
  const by = to.y - at.y;
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/** Of the edges that leave a point, the one that keeps the face on the left: the sharpest left turn. */
function onward(
  nodes: FrontResult['nodes'],
  arrived: FrontHalfEdge,
  leaving: readonly FrontHalfEdge[],
): FrontHalfEdge | undefined {
  const from = nodes[arrived.from] as PlanPoint;
  const at = nodes[arrived.to] as PlanPoint;
  let best: FrontHalfEdge | undefined;
  let sharpest = Number.NEGATIVE_INFINITY;
  for (const edge of leaving) {
    const angle = turn(from, at, nodes[edge.to] as PlanPoint);
    if (angle > sharpest) {
      sharpest = angle;
      best = edge;
    }
  }
  return best;
}

/** One plane's edges walked into rings. */
function ringsOf(nodes: FrontResult['nodes'], edges: readonly FrontHalfEdge[]): FrontHalfEdge[][] {
  const unused = new Set(edges);
  const rings: FrontHalfEdge[][] = [];
  for (const first of edges) {
    if (!unused.has(first)) continue;
    const ring: FrontHalfEdge[] = [];
    let edge: FrontHalfEdge | undefined = first;
    while (edge !== undefined && unused.has(edge)) {
      unused.delete(edge);
      ring.push(edge);
      const reached: FrontHalfEdge = edge;
      const leaving = [...unused].filter((next) => next.from === reached.to);
      edge = onward(nodes, reached, leaving);
    }
    // A walk that did not come back to its start is an open run of edges: no face.
    if (ring.at(-1)?.to === first.from) rings.push(ring);
  }
  return rings;
}

/** Every face of the run, plane by plane; a face with no area (a wall) is left out. */
export function facesOf(result: FrontResult): FrontFace[] {
  const byPlane = new Map<number, FrontHalfEdge[]>();
  for (const edge of result.halfEdges) {
    byPlane.set(edge.plane, [...(byPlane.get(edge.plane) ?? []), edge]);
  }
  const faces: FrontFace[] = [];
  for (const [plane, edges] of byPlane) {
    for (const ring of ringsOf(result.nodes, edges)) {
      const points = ring.map((edge) => result.nodes[edge.from] as PlanPoint);
      if (ringArea(points) < NO_AREA_M2) continue;
      faces.push({
        plane,
        ring: ring.map((edge) => edge.from),
        kinds: ring.map((edge) => edge.kind),
      });
    }
  }
  return faces;
}
