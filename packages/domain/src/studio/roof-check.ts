import { GROUND_REACH_M, type Roof, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { between, CORNER_GAP_M, edgesCross, pointInside, roofsOverlap } from './roof-shape';
import type { Guide, RoofSnap } from './roof-snap';

/**
 * What every change to a standing roof answers (`T-M05-002`, part b): the design after it, or why
 * it is not made. Every change works on the whole document, so one change is one Undo, and is
 * checked the same way: no edges that cross, no roof over another, nothing past the site's reach.
 */

/** Why a change is not made. */
export type EditRefusal =
  | 'too_short'
  | 'too_long'
  | 'would_cross'
  | 'would_overlap'
  | 'too_far'
  /** Two corners would stand within `CORNER_GAP_M` of each other. */
  | 'too_close'
  /** A typed or measured length would change because of another edge; `edge` names it. */
  | 'held_length'
  /** Both lengths at a dragged corner are typed: the corner cannot move. */
  | 'two_held'
  | 'keeps_three'
  | 'too_many_corners'
  /** The first length would stretch the picture past five times, or shrink it past a fifth. */
  | 'scale_out_of_range';

export type EditResult =
  | { readonly kind: 'done'; readonly document: StudioDocument }
  | { readonly kind: 'refused'; readonly refusal: EditRefusal; readonly edge?: number };

/** A drag in hand: the roof as it would stand, what it snapped to, and why it would go back. */
export interface DragResult {
  readonly document: StudioDocument;
  readonly snap: RoofSnap | null;
  readonly fault: EditRefusal | null;
  /** The lines the dragged corner is held on, drawn dashed across the map. */
  readonly guides: readonly Guide[];
}

export interface TurnResult extends DragResult {
  /** The turn made, in degrees anticlockwise: what was asked, or the angle that lined it up. */
  readonly degrees: number;
  readonly snapped: boolean;
}

export function withRoof(document: StudioDocument, index: number, roof: Roof): StudioDocument {
  return { ...document, roofs: document.roofs.map((r, i) => (i === index ? roof : r)) };
}

export function roofAt(document: StudioDocument, index: number): Roof {
  const roof = document.roofs[index];
  if (roof === undefined) throw new RangeError(`no roof ${index}`);
  return roof;
}

/** What is wrong with a roof standing on these corners among the design's other roofs. */
export function faultOf(
  document: StudioDocument,
  index: number,
  corners: readonly GroundPoint[],
): EditRefusal | null {
  if (
    corners.some((c) => Math.abs(c.east) > GROUND_REACH_M || Math.abs(c.north) > GROUND_REACH_M)
  ) {
    return 'too_far';
  }
  if (edgesCross(corners)) return 'would_cross';
  if (corners.some((c, i) => corners.some((d, j) => j > i && between(c, d) < CORNER_GAP_M))) {
    return 'too_close';
  }
  const overlaps = document.roofs.some(
    (roof, i) => i !== index && roofsOverlap(corners, roof.corners),
  );
  return overlaps ? 'would_overlap' : null;
}

/** The roof a point lies inside, the last drawn first; `null` on open ground. */
export function roofUnder(
  roofs: readonly { readonly corners: readonly GroundPoint[] }[],
  at: GroundPoint,
): number | null {
  for (let i = roofs.length - 1; i >= 0; i--) {
    if (pointInside(at, (roofs[i] as (typeof roofs)[number]).corners)) return i;
  }
  return null;
}
