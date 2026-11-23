import { lengthHeld, type RoofEdgeTrust, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { lengthIsFirst, onPicture } from './roof-length';
import { cornerAfter, edgeLengths, roofMiddle } from './roof-shape';

/** Each roof's marks as the roof step draws them (`T-M05-002`, part b): its edges and their labels. */

/** One edge as its label shows it. */
export interface EdgeView {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly metres: number;
  readonly trust: RoofEdgeTrust;
  /** No person set it — from the picture, or the market's usual size: its label reads "about". */
  readonly about: boolean;
  /** The longest length from the picture, before any is set: type it first. */
  readonly pulse: boolean;
}

/** One roof as its marks show it. */
export interface RoofMarksView {
  readonly id: string;
  readonly corners: readonly GroundPoint[];
  readonly middle: GroundPoint;
  readonly edges: readonly EdgeView[];
}

export function roofMarksOf(document: StudioDocument): readonly RoofMarksView[] {
  return document.roofs.map((roof) => {
    const lengths = edgeLengths(roof.corners);
    const longest = lengths.indexOf(Math.max(...lengths));
    // Type it first: on a picture roof, the length that will size the picture; on a typed or grid
    // roof, its longest while none of its own is set.
    const pulses = onPicture(roof)
      ? lengthIsFirst(document, roof.tracedOn)
      : !roof.edges.some(lengthHeld);
    return {
      id: roof.id,
      corners: roof.corners,
      middle: roofMiddle(roof.corners),
      edges: lengths.map((metres, i) => ({
        from: roof.corners[i] as GroundPoint,
        to: cornerAfter(roof.corners, i),
        metres,
        trust: roof.edges[i] ?? 'traced',
        about: !lengthHeld(roof.edges[i] ?? 'traced'),
        pulse: pulses && i === longest,
      })),
    };
  });
}
