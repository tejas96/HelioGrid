import { cornerRoom, GROUND_REACH_M, type PictureChoice, ROOFS_MAX, type Roof } from './document';
import type { GroundPoint } from './ground';
import type { HandFaceRefusal } from './roof-hand-faces';
import {
  angleAt,
  between,
  CORNER_GAP_M,
  edgesCross,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
} from './roof-shape';
import { draftSpot, type RoofSnap, SNAP_M, type SnapTargets } from './roof-snap';

/**
 * Drawing a new roof in the top view (`T-M05-002`, part b): each tap places a corner, snapped to
 * what is near; a tap on the first corner or Close shape closes it. The draft is the corners placed
 * so far; it is never saved, and Cancel or Esc drops it.
 */

/** A corner whose angle is this near square counts as square: the ghost corner, a length's slide. */
export const SQUARE_EXACT_DEGREES = 0.5;

/** Why a corner or a close is refused while drawing. */
export type DraftRefusal =
  | 'would_cross'
  /** Within `CORNER_GAP_M` of a corner placed before. */
  | 'too_close'
  | 'too_far'
  | 'too_many_corners'
  | 'too_few_corners'
  | 'too_many_roofs'
  /** A face drawn by hand (Any shape): it leaves its roof, lies over a face, or is one too many. */
  | HandFaceRefusal;

export type DraftTap =
  | {
      readonly kind: 'added';
      readonly corners: readonly GroundPoint[];
      readonly snap: RoofSnap | null;
    }
  /** The tap was on the last corner again: nothing to add. */
  | { readonly kind: 'same' }
  | { readonly kind: 'refused'; readonly refusal: DraftRefusal };

/** A tap while drawing: a corner added where it snaps, nothing on the last corner, or the reason it cannot go there. */
export function draftTap(
  corners: readonly GroundPoint[],
  at: GroundPoint,
  targets: SnapTargets,
  magnet: boolean,
): DraftTap {
  const { point, snap } = draftSpot(corners, at, targets, magnet);
  const last = corners.at(-1);
  if (last !== undefined && between(last, point) < CORNER_GAP_M) return { kind: 'same' };
  if (corners.some((corner) => between(corner, point) < CORNER_GAP_M)) {
    return { kind: 'refused', refusal: 'too_close' };
  }
  if (Math.abs(point.east) > GROUND_REACH_M || Math.abs(point.north) > GROUND_REACH_M) {
    return { kind: 'refused', refusal: 'too_far' };
  }
  if (corners.length >= ROOF_CORNERS_MAX) return { kind: 'refused', refusal: 'too_many_corners' };
  const next = [...corners, point];
  if (edgesCross(next, false)) return { kind: 'refused', refusal: 'would_cross' };
  return { kind: 'added', corners: next, snap };
}

/**
 * Whether a tap at this spot closes the shape: it lands on the first corner, within the snap's
 * reach, once the shape has corners enough to close — with the ghost's fourth, three will do.
 */
export function draftClosesAt(corners: readonly GroundPoint[], at: GroundPoint): boolean {
  const first = corners[0];
  const enough = corners.length + (draftGhost(corners) === null ? 0 : 1) >= ROOF_CORNERS_MIN;
  return first !== undefined && enough && between(first, at) <= SNAP_M;
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
 * the picture shown. It may lie over another roof, in one or beside one: no roof is refused for
 * where it lies (`T-M05-002`, part e), and how it meets the others says what it is (`roof-place.ts`).
 */
export function draftClose(
  corners: readonly GroundPoint[],
  roofs: readonly Roof[],
  id: string,
  tracedOn: PictureChoice,
  /** Take the ghost corner when it is offered: Close shape does, a tap on the first corner not. */
  withGhost: boolean,
): DraftClose {
  if (roofs.length >= ROOFS_MAX) return { kind: 'refused', refusal: 'too_many_roofs' };
  const ghost = withGhost ? draftGhost(corners) : null;
  const outline = ghost === null ? corners : [...corners, ghost];
  if (outline.length < ROOF_CORNERS_MIN) return { kind: 'refused', refusal: 'too_few_corners' };
  if (outline.length > cornerRoom(roofs)) return { kind: 'refused', refusal: 'too_many_corners' };
  if (edgesCross(outline)) return { kind: 'refused', refusal: 'would_cross' };
  return {
    kind: 'closed',
    roof: { id, corners: outline, edges: outline.map(() => 'traced'), tracedOn, height: null },
  };
}
