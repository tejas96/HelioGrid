import { cornerRoom, lengthHeld, type RoofEdgeTrust, type StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { type DragResult, type EditResult, faultOf, roofAt, withRoof } from './roof-check';
import { cornerMagnet, heldPlaced } from './roof-corner-magnet';
import {
  between,
  CORNER_GAP_M,
  cornerAfter,
  ROOF_CORNERS_MAX,
  ROOF_CORNERS_MIN,
} from './roof-shape';
import { roofWithCorner, roofWithoutCorner } from './roof-sides';
import { SNAP_M } from './roof-snap';

/**
 * Fixing a roof's shape once it stands (`T-M05-002`, part b): drag a corner with the magnet, add
 * one with the +, remove a picked one (moving and turning a whole roof: `roof-move.ts`). A drag
 * hands back the roof as it would stand, what it snapped to, and why it would go back.
 */

/**
 * A corner dragged to `to`. The magnet, when on, pulls it within `reach` and lets go as the finger
 * moves on; off, the corner goes exactly where it is dragged.
 * A typed neighbour edge keeps its length: the corner slides round that edge's other end, and with
 * the magnet on stops where that circle crosses another roof's wall line. Two typed neighbours hold
 * the corner still. A fault means the roof goes back when the drag ends.
 */
export function cornerDragged(
  document: StudioDocument,
  roofIndex: number,
  corner: number,
  to: GroundPoint,
  magnet: boolean,
  /** How near a spot must come to snap, in metres: the screen's reach at this zoom. */
  reach: number = SNAP_M,
): DragResult {
  const roof = roofAt(document, roofIndex);
  const { corners, edges } = roof;
  const count = corners.length;
  const beforeEdge = (corner - 1 + count) % count;
  const heldBefore = lengthHeld(edges[beforeEdge] ?? 'traced');
  const heldAfter = lengthHeld(edges[corner] ?? 'traced');
  if (heldBefore && heldAfter) return { document, snap: null, fault: 'two_held', guides: [] };
  const held = heldBefore || heldAfter ? (heldBefore ? beforeEdge : corner) : null;
  const placed =
    held === null
      ? magnet
        ? cornerMagnet(corners, corner, to, document, roofIndex, reach)
        : { point: to, snap: null, guides: [] }
      : heldPlaced(corners, held, held === corner, to, magnet, { document, roofIndex, reach });
  const moved = corners.map((c, i) => (i === corner ? placed.point : c));
  return {
    document: withRoof(document, roofIndex, { ...roof, corners: moved }),
    snap: placed.snap,
    fault: faultOf(moved),
    guides: placed.guides,
  };
}

/** The + on an edge: a corner at its middle, ready to drag. Both halves are traced. */
export function cornerAdded(document: StudioDocument, roofIndex: number, edge: number): EditResult {
  const roof = roofAt(document, roofIndex);
  if (roof.corners.length >= ROOF_CORNERS_MAX || cornerRoom(document.roofs) < 1) {
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
  const added = roofWithCorner(roof, edge, middle, { corners, edges });
  return { kind: 'done', document: withRoof(document, roofIndex, added) };
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
  const fault = faultOf(corners);
  if (fault !== null) return { kind: 'refused', refusal: fault };
  const removed = roofWithoutCorner(roof, corner, { corners, edges });
  return { kind: 'done', document: withRoof(document, roofIndex, removed) };
}
