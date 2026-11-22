import { lengthHeld, type RoofEdgeTrust, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { type DragResult, type EditResult, faultOf, roofAt, withRoof } from './roof-check';
import {
  between,
  CORNER_GAP_M,
  cornerAfter,
  cornerBefore,
  edgeLengths,
  nearestOnSegment,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
} from './roof-shape';
import {
  type Guide,
  guideOf,
  type RoofSnap,
  SNAP_M,
  snapTargetsOf,
  snapToTargets,
} from './roof-snap';

/**
 * Fixing a roof's shape once it stands (`T-M05-002`, part b): drag a corner with the magnet, add
 * one with the +, remove a picked one (moving and turning a whole roof: `roof-move.ts`). A drag
 * hands back the roof as it would stand, what it snapped to, and why it would go back.
 */

/** The point where two lines cross: each through a point, running a way; `null` when parallel. */
function lineCross(
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
function ontoLine(point: GroundPoint, on: GroundPoint, way: GroundPoint): GroundPoint {
  const far = { east: on.east + way.east * 1e4, north: on.north + way.north * 1e4 };
  const back = { east: on.east - way.east * 1e4, north: on.north - way.north * 1e4 };
  return nearestOnSegment(point, back, far);
}

/** Square to the edge from `from` to `to`, at `to`: the way a line runs that makes a square corner there. */
function squareAt(from: GroundPoint, to: GroundPoint): GroundPoint {
  return { east: -(to.north - from.north), north: to.east - from.east };
}

/** The two sides of a square corner at `point`, as guides. */
function sidesAt(point: GroundPoint, before: GroundPoint, after: GroundPoint): Guide[] {
  const way = (to: GroundPoint) => ({ east: to.east - point.east, north: to.north - point.north });
  return [guideOf(point, way(before)), guideOf(point, way(after))];
}

interface Placed {
  readonly point: GroundPoint;
  readonly snap: RoofSnap | null;
  readonly guides: readonly Guide[];
}

/**
 * Where a dragged corner snaps: another roof's corner or edge; a square corner — at both of its
 * neighbours, or at itself; square at one neighbour. Each within `SNAP_M`; the first found wins.
 */
function cornerMagnet(
  corners: readonly GroundPoint[],
  corner: number,
  to: GroundPoint,
  document: StudioDocument,
  roofIndex: number,
): Placed {
  const target = snapToTargets(to, snapTargetsOf(document.roofs, roofIndex));
  if (target !== null) return target;
  const before = cornerBefore(corners, corner);
  const after = cornerAfter(corners, corner);
  const beforeThat = cornerBefore(corners, (corner - 1 + corners.length) % corners.length);
  const afterThat = cornerAfter(corners, (corner + 1) % corners.length);
  const wayAtBefore = squareAt(beforeThat, before);
  const wayAtAfter = squareAt(afterThat, after);
  const candidates: { point: GroundPoint | null; snap: RoofSnap; guides: readonly Guide[] }[] = [];
  if (corners.length > ROOF_CORNERS_MIN) {
    candidates.push({
      point: lineCross(before, wayAtBefore, after, wayAtAfter),
      snap: { kind: 'square_corner' },
      guides: [guideOf(before, wayAtBefore), guideOf(after, wayAtAfter)],
    });
  }
  // Square at itself: on the circle whose diameter joins its two neighbours.
  const centre = { east: (before.east + after.east) / 2, north: (before.north + after.north) / 2 };
  const radius = between(before, after) / 2;
  const fromCentre = between(centre, to);
  if (fromCentre > 0) {
    const point = {
      east: centre.east + ((to.east - centre.east) / fromCentre) * radius,
      north: centre.north + ((to.north - centre.north) / fromCentre) * radius,
    };
    candidates.push({
      point,
      snap: { kind: 'square_corner' },
      guides: sidesAt(point, before, after),
    });
  }
  if (corners.length > ROOF_CORNERS_MIN) {
    const lines = [
      {
        point: ontoLine(to, before, wayAtBefore),
        snap: { kind: 'square' } as const,
        guides: [guideOf(before, wayAtBefore)],
      },
      {
        point: ontoLine(to, after, wayAtAfter),
        snap: { kind: 'square' } as const,
        guides: [guideOf(after, wayAtAfter)],
      },
    ].sort((x, y) => between(x.point, to) - between(y.point, to));
    candidates.push(...lines);
  }
  const found = candidates.find(
    (c): c is { point: GroundPoint; snap: RoofSnap; guides: readonly Guide[] } =>
      c.point !== null && between(c.point, to) <= SNAP_M,
  );
  return found ?? { point: to, snap: null, guides: [] };
}

/**
 * A corner dragged to `to`. The magnet, when on, pulls it within `SNAP_M` and lets go as the finger
 * moves on; off, the corner goes exactly where it is dragged.
 * A typed neighbour edge keeps its length: the corner slides round that edge's other end. Two typed
 * neighbours hold the corner still. A fault means the roof goes back when the drag ends.
 */
export function cornerDragged(
  document: StudioDocument,
  roofIndex: number,
  corner: number,
  to: GroundPoint,
  magnet: boolean,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const { corners, edges } = roof;
  const count = corners.length;
  const beforeEdge = (corner - 1 + count) % count;
  const heldBefore = lengthHeld(edges[beforeEdge] ?? 'traced');
  const heldAfter = lengthHeld(edges[corner] ?? 'traced');
  if (heldBefore && heldAfter) return { document, snap: null, fault: 'two_held', guides: [] };
  let placed: Placed;
  if (heldBefore || heldAfter) {
    const anchor = heldBefore ? cornerBefore(corners, corner) : cornerAfter(corners, corner);
    const metres = edgeLengths(corners)[heldBefore ? beforeEdge : corner] ?? 0;
    const reach = between(anchor, to) || 1;
    placed = {
      point: {
        east: anchor.east + ((to.east - anchor.east) / reach) * metres,
        north: anchor.north + ((to.north - anchor.north) / reach) * metres,
      },
      snap: { kind: 'held', metres, centre: anchor },
      guides: [],
    };
  } else {
    placed = magnet
      ? cornerMagnet(corners, corner, to, document, roofIndex)
      : { point: to, snap: null, guides: [] };
  }
  const moved = corners.map((c, i) => (i === corner ? placed.point : c));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners: moved }),
    snap: placed.snap,
    fault: faultOf(document, roofIndex, moved),
    guides: placed.guides,
  };
}

/** The + on an edge: a corner at its middle, ready to drag. Both halves are traced. */
export function cornerAdded(document: StudioDocument, roofIndex: number, edge: number): EditResult {
  const roof = roofAt(document, roofIndex);
  if (roof.corners.length >= ROOF_CORNERS_MAX) {
    return { kind: 'refused', refusal: 'too_many_corners' };
  }
  const start = roof.corners[edge] as GroundPoint;
  const end = cornerAfter(roof.corners, edge);
  // Its middle would stand within the corner gap of both ends: no room for a corner.
  if (between(start, end) < 2 * CORNER_GAP_M) return { kind: 'refused', refusal: 'too_close' };
  const middle = { east: (start.east + end.east) / 2, north: (start.north + end.north) / 2 };
  const corners = [...roof.corners.slice(0, edge + 1), middle, ...roof.corners.slice(edge + 1)];
  const edges: RoofEdgeTrust[] = [
    ...roof.edges.slice(0, edge),
    'traced',
    'traced',
    ...roof.edges.slice(edge + 1),
  ];
  return { kind: 'done', document: withRoof(document, roofIndex, { ...roof, corners, edges }) };
}

/** The corner of a roof nearest a point: where a finger on crowded dots meant to hold. */
export function cornerNearest(corners: readonly GroundPoint[], at: GroundPoint): number {
  let best = 0;
  corners.forEach((corner, i) => {
    if (between(corner, at) < between(corners[best] as GroundPoint, at)) best = i;
  });
  return best;
}

/** × on a picked corner: it goes, and its two edges join as one traced edge. A roof keeps three. */
export function cornerRemoved(
  document: StudioDocument,
  roofIndex: number,
  corner: number,
): EditResult {
  const roof = roofAt(document, roofIndex);
  const count = roof.corners.length;
  if (count <= ROOF_CORNERS_MIN) return { kind: 'refused', refusal: 'keeps_three' };
  const corners = roof.corners.filter((_, i) => i !== corner);
  const beforeEdge = (corner - 1 + count) % count;
  // The edge before the corner becomes the joined edge; the edge after it goes.
  const edges = roof.edges
    .map((trust, i): RoofEdgeTrust => (i === beforeEdge ? 'traced' : trust))
    .filter((_, i) => i !== corner);
  const fault = faultOf(document, roofIndex, corners);
  if (fault !== null) return { kind: 'refused', refusal: fault };
  return { kind: 'done', document: withRoof(document, roofIndex, { ...roof, corners, edges }) };
}
