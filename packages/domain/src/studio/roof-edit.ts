import type { RoofEdgeTrust, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import {
  type DragResult,
  type EditResult,
  faultOf,
  roofAt,
  type TurnResult,
  withRoof,
} from './roof-check';
import {
  between,
  CORNER_GAP_M,
  cornerAfter,
  cornerBefore,
  edgeLengths,
  nearestOnSegment,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
  roofMiddle,
} from './roof-shape';
import { type Guide, type RoofSnap, SNAP_M, snapTargetsOf, snapToTargets } from './roof-snap';

/**
 * Fixing a roof's shape once it stands (`T-M05-002`, part b): drag a corner with the magnet, add
 * one with the +, remove a picked one, move the roof and turn it. A drag hands back the roof as it
 * would stand, what it snapped to, and why it would go back.
 */

/** Within this many degrees, a turned roof lines up with another roof's edge. */
export const TURN_SNAP_DEGREES = 3;
/** One arrow key on a move handle moves the roof this far, in metres. */
export const KEY_MOVE_M = 0.1;
/** One arrow key on a turn handle turns the roof this far, in degrees. */
export const KEY_TURN_DEGREES = 1;

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

/** A guide through `through`, running `way`, scaled to one metre. */
function guideOf(through: GroundPoint, way: GroundPoint): Guide {
  const reach = Math.hypot(way.east, way.north) || 1;
  return { through, way: { east: way.east / reach, north: way.north / reach } };
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
  const heldBefore = edges[beforeEdge] !== 'traced';
  const heldAfter = edges[corner] !== 'traced';
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

/** The whole roof moved by `by` metres east and north. */
export function roofMoved(
  document: StudioDocument,
  roofIndex: number,
  by: GroundPoint,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const corners = roof.corners.map((c) => ({ east: c.east + by.east, north: c.north + by.north }));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners }),
    snap: null,
    fault: faultOf(document, roofIndex, corners),
    guides: [],
  };
}

/** The difference between two directions of lines, in degrees, folded into −90 to 90. */
function lineTurn(from: number, to: number): number {
  let turn = (to - from) % 180;
  if (turn > 90) turn -= 180;
  if (turn < -90) turn += 180;
  return turn;
}

function directionOf(a: GroundPoint, b: GroundPoint): number {
  return (Math.atan2(b.north - a.north, b.east - a.east) * 180) / Math.PI;
}

/**
 * The roof turned `degrees` anticlockwise about its middle. With the magnet on, within
 * `TURN_SNAP_DEGREES` of lining an edge up with another roof's edge, it lines up.
 */
export function roofTurned(
  document: StudioDocument,
  roofIndex: number,
  degrees: number,
  magnet: boolean,
): TurnResult {
  const roof = roofAt(document, roofIndex);
  const edges = magnet ? snapTargetsOf(document.roofs, roofIndex).edges : [];
  const targets = edges.map((e) => directionOf(e.from, e.to));
  let applied = degrees;
  let snapped = false;
  let nearest = TURN_SNAP_DEGREES + 1e-9;
  roof.corners.forEach((corner, i) => {
    const own = directionOf(corner, cornerAfter(roof.corners, i)) + degrees;
    for (const target of targets) {
      const off = lineTurn(own, target);
      if (Math.abs(off) <= nearest) {
        nearest = Math.abs(off);
        applied = degrees + off;
        snapped = true;
      }
    }
  });
  const middle = roofMiddle(roof.corners);
  const r = (applied * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const corners = roof.corners.map((c) => ({
    east: middle.east + (c.east - middle.east) * cos - (c.north - middle.north) * sin,
    north: middle.north + (c.east - middle.east) * sin + (c.north - middle.north) * cos,
  }));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners }),
    snap: null,
    fault: faultOf(document, roofIndex, corners),
    guides: [],
    degrees: applied,
    snapped,
  };
}
