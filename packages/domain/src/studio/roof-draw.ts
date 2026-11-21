import { GROUND_REACH_M, type PictureChoice, ROOFS_MAX, type Roof } from './document';
import type { GroundPoint } from './ground';
import {
  angleAt,
  between,
  cornerAfter,
  edgesCross,
  nearestOnSegment,
  pointInside,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
  roofsOverlap,
  segmentsCross,
} from './roof-shape';

/**
 * Drawing a new roof in the top view (`T-M05-002`, part b): each tap places a corner, snapped to
 * what is near; a tap on the first corner or Close shape closes it. The draft is the corners placed
 * so far; it is never saved, and Cancel or Esc drops it.
 */

/** How near a spot must come to a corner, an edge or a line-up to snap onto it, in metres. */
export const SNAP_M = 0.5;
/** How near a new edge must come to square with the last one to snap square, in degrees. */
export const SQUARE_SNAP_DEGREES = 6;
/** A tap this near the last corner places nothing: a double tap is one corner. */
export const SAME_TAP_M = 0.2;
/** A corner whose angle is this near square counts as square: the ghost corner, a length's slide. */
export const SQUARE_EXACT_DEGREES = 0.5;

/**
 * Who owns a corner or an edge a spot can snap to. The design's other roofs now; the building and
 * its neighbours from the height map join here (part g).
 */
export type SnapOwner = { readonly kind: 'roof'; readonly roof: number };

/** What a spot can snap to besides the roof in hand. */
export interface SnapTargets {
  readonly corners: readonly { readonly at: GroundPoint; readonly owner: SnapOwner }[];
  readonly edges: readonly {
    readonly from: GroundPoint;
    readonly to: GroundPoint;
    readonly owner: SnapOwner;
  }[];
}

export const NO_SNAP_TARGETS: SnapTargets = { corners: [], edges: [] };

/** The corners and edges of the design's roofs, except the roof at `except` — the one in hand. */
export function snapTargetsOf(roofs: readonly Roof[], except?: number): SnapTargets {
  const others = roofs.flatMap((roof, index) =>
    index === except ? [] : [{ roof, owner: { kind: 'roof', roof: index } as const }],
  );
  return {
    corners: others.flatMap(({ roof, owner }) => roof.corners.map((at) => ({ at, owner }))),
    edges: others.flatMap(({ roof, owner }) =>
      roof.corners.map((from, i) => ({ from, to: cornerAfter(roof.corners, i), owner })),
    ),
  };
}

/** What a spot snapped to, named on the small label beside it. */
export type RoofSnap =
  | { readonly kind: 'corner_of'; readonly owner: SnapOwner }
  | { readonly kind: 'edge_of'; readonly owner: SnapOwner }
  | { readonly kind: 'square' }
  /** Square, and level with an earlier corner (`corner`, from 0): an L closes straight. */
  | { readonly kind: 'lines_up'; readonly corner: number }
  /** A corner dragged into a square corner. */
  | { readonly kind: 'square_corner' }
  /** A corner dragged round a typed length, which keeps its `metres`. */
  | { readonly kind: 'held'; readonly metres: number };

export interface Snapped {
  readonly point: GroundPoint;
  readonly snap: RoofSnap | null;
}

/** A spot on another roof's corner, then on its edge, when one lies within `SNAP_M`. */
export function snapToTargets(at: GroundPoint, targets: SnapTargets): Snapped | null {
  const corner = targets.corners.find((target) => between(target.at, at) <= SNAP_M);
  if (corner !== undefined) {
    return { point: corner.at, snap: { kind: 'corner_of', owner: corner.owner } };
  }
  let best: Snapped | null = null;
  let bestReach = SNAP_M;
  for (const edge of targets.edges) {
    const on = nearestOnSegment(at, edge.from, edge.to);
    const reach = between(on, at);
    if (reach <= bestReach) {
      bestReach = reach;
      best = { point: on, snap: { kind: 'edge_of', owner: edge.owner } };
    }
  }
  return best;
}

function unit(from: GroundPoint, to: GroundPoint): GroundPoint {
  const reach = between(from, to) || 1;
  return { east: (to.east - from.east) / reach, north: (to.north - from.north) / reach };
}

function dot(a: GroundPoint, b: GroundPoint): number {
  return a.east * b.east + a.north * b.north;
}

function along(from: GroundPoint, way: GroundPoint, metres: number): GroundPoint {
  return { east: from.east + way.east * metres, north: from.north + way.north * metres };
}

/**
 * Where a tap lands while drawing, snapped in order: another roof's corner, another roof's edge,
 * then square to the last edge — and, square or not, level with an earlier corner.
 */
export function draftSpot(
  corners: readonly GroundPoint[],
  at: GroundPoint,
  targets: SnapTargets,
): Snapped {
  const onTarget = snapToTargets(at, targets);
  if (onTarget !== null) return onTarget;
  const last = corners.at(-1);
  const before = corners.at(-2);
  if (last === undefined || before === undefined || between(last, at) === 0) {
    return { point: at, snap: null };
  }
  // The corners a line-up can name: not the last two, whose line the new edge already touches.
  const earlier = corners.slice(0, -2);
  const angle = angleAt(before, last, at);
  if (Math.abs(angle - 90) <= SQUARE_SNAP_DEGREES) {
    // Square: the new edge runs at right angles to the last, the way the tap leans.
    const lastWay = unit(before, last);
    const across = { east: -lastWay.north, north: lastWay.east };
    const sign =
      dot(across, { east: at.east - last.east, north: at.north - last.north }) < 0 ? -1 : 1;
    const way = { east: across.east * sign, north: across.north * sign };
    const reach = dot(way, { east: at.east - last.east, north: at.north - last.north });
    let lineUp: { corner: number; reach: number } | null = null;
    earlier.forEach((corner, index) => {
      const level = dot(way, { east: corner.east - last.east, north: corner.north - last.north });
      const off = Math.abs(level - reach);
      if (level > 0 && off <= SNAP_M && (lineUp === null || off < Math.abs(lineUp.reach - reach))) {
        lineUp = { corner: index, reach: level };
      }
    });
    const found = lineUp as { corner: number; reach: number } | null;
    if (found !== null) {
      return {
        point: along(last, way, found.reach),
        snap: { kind: 'lines_up', corner: found.corner },
      };
    }
    return { point: along(last, way, reach), snap: { kind: 'square' } };
  }
  // Not square: the spot still lines up, east–west or north–south of the first edge's frame, with
  // an earlier corner.
  const first = unit(corners[0] as GroundPoint, corners[1] as GroundPoint);
  const frame = [first, { east: -first.north, north: first.east }];
  let point = at;
  let snap: RoofSnap | null = null;
  for (const axis of frame) {
    let best: { corner: number; off: number } | null = null;
    earlier.forEach((corner, index) => {
      const off = dot(axis, { east: corner.east - point.east, north: corner.north - point.north });
      if (Math.abs(off) <= SNAP_M && (best === null || Math.abs(off) < Math.abs(best.off))) {
        best = { corner: index, off };
      }
    });
    const found = best as { corner: number; off: number } | null;
    if (found !== null) {
      point = along(point, axis, found.off);
      snap = { kind: 'lines_up', corner: found.corner };
    }
  }
  return { point, snap };
}

/** Why a corner or a close is refused while drawing. */
export type DraftRefusal =
  | 'would_cross'
  | 'would_overlap'
  | 'too_far'
  | 'too_many_corners'
  | 'too_few_corners'
  | 'too_many_roofs';

export type DraftTap =
  | {
      readonly kind: 'added';
      readonly corners: readonly GroundPoint[];
      readonly snap: RoofSnap | null;
    }
  /** The tap was on the last corner again: nothing to add. */
  | { readonly kind: 'same' }
  | { readonly kind: 'refused'; readonly refusal: DraftRefusal };

/** Whether a line from one spot to another runs across any roof of the design, or ends inside one. */
function crossesRoofs(from: GroundPoint, to: GroundPoint, roofs: readonly Roof[]): boolean {
  return roofs.some(
    (roof) =>
      pointInside(to, roof.corners) ||
      roof.corners.some((corner, i) =>
        segmentsCross(from, to, corner, cornerAfter(roof.corners, i)),
      ),
  );
}

/** A tap while drawing: a corner added where it snaps, nothing on the last corner, or the reason it cannot go there. */
export function draftTap(
  corners: readonly GroundPoint[],
  at: GroundPoint,
  targets: SnapTargets,
  roofs: readonly Roof[],
): DraftTap {
  const { point, snap } = draftSpot(corners, at, targets);
  const last = corners.at(-1);
  if (last !== undefined && between(last, point) < SAME_TAP_M) return { kind: 'same' };
  if (Math.abs(point.east) > GROUND_REACH_M || Math.abs(point.north) > GROUND_REACH_M) {
    return { kind: 'refused', refusal: 'too_far' };
  }
  if (corners.length >= ROOF_CORNERS_MAX) return { kind: 'refused', refusal: 'too_many_corners' };
  const next = [...corners, point];
  if (edgesCross(next, false)) return { kind: 'refused', refusal: 'would_cross' };
  if (crossesRoofs(last ?? point, point, roofs))
    return { kind: 'refused', refusal: 'would_overlap' };
  return { kind: 'added', corners: next, snap };
}

/**
 * The fourth corner offered after three with a square middle one: it makes the rectangle, so Close
 * shape finishes a rectangle in three corners. Any other tap drops it, for it is a fourth corner.
 */
export function draftGhost(corners: readonly GroundPoint[]): GroundPoint | null {
  if (corners.length !== 3) return null;
  const [a, b, c] = corners as [GroundPoint, GroundPoint, GroundPoint];
  if (Math.abs(angleAt(a, b, c) - 90) > SQUARE_EXACT_DEGREES) return null;
  return { east: a.east + c.east - b.east, north: a.north + c.north - b.north };
}

export type DraftClose =
  | { readonly kind: 'closed'; readonly roof: Roof }
  | { readonly kind: 'refused'; readonly refusal: DraftRefusal };

/**
 * The draft closed into a roof — with the ghost corner when it is offered. Every edge is traced, on
 * the picture shown; the roof may share a wall with another, never cross it or lie inside it.
 */
export function draftClose(
  corners: readonly GroundPoint[],
  roofs: readonly Roof[],
  id: string,
  tracedOn: PictureChoice,
): DraftClose {
  if (roofs.length >= ROOFS_MAX) return { kind: 'refused', refusal: 'too_many_roofs' };
  const ghost = draftGhost(corners);
  const outline = ghost === null ? corners : [...corners, ghost];
  if (outline.length < ROOF_CORNERS_MIN) return { kind: 'refused', refusal: 'too_few_corners' };
  if (edgesCross(outline)) return { kind: 'refused', refusal: 'would_cross' };
  if (roofs.some((roof) => roofsOverlap(outline, roof.corners))) {
    return { kind: 'refused', refusal: 'would_overlap' };
  }
  return {
    kind: 'closed',
    roof: { id, corners: outline, edges: outline.map(() => 'traced'), tracedOn },
  };
}
