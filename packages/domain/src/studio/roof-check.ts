import { GROUND_REACH_M, type Roof, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { RoofSnap } from './roof-draw';
import { edgesCross, roofsOverlap } from './roof-shape';

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
  const overlaps = document.roofs.some(
    (roof, i) => i !== index && roofsOverlap(corners, roof.corners),
  );
  return overlaps ? 'would_overlap' : null;
}
