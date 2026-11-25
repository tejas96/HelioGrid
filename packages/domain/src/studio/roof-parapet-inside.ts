import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import type { RoofFacts } from './roof-levels';
import { edgesOf, parapetInM, parapetNow } from './roof-open-edges';
import type { SnapTargets } from './roof-snap';
import { ringArea } from './wavefront-lines';

/**
 * The inside faces of the roofs' parapets (`T-M05-002`, part e, E130): where each walled stretch
 * of a side stands in from the outline by what is built there (`parapetInM`) — so a roof dragged onto another pulls clear of the wall, as a stair room stands.
 */
export function parapetInsidesOf(document: StudioDocument, facts: RoofFacts): SnapTargets['edges'] {
  return document.roofs.flatMap((roof, index) => {
    const inM = parapetInM(parapetNow(document, roof, facts));
    if (inM <= 0) return [];
    // Inward is to the left of an anticlockwise ring's sides.
    const turn = ringArea(roof.corners.map((c) => ({ x: c.east, y: c.north }))) >= 0 ? 1 : -1;
    return edgesOf(document, index, facts).flatMap((stretches, side) => {
      const from = roof.corners[side] as GroundPoint;
      const to = roof.corners[(side + 1) % roof.corners.length] as GroundPoint;
      const length = Math.hypot(to.east - from.east, to.north - from.north) || 1;
      const inward = {
        east: (-turn * (to.north - from.north) * inM) / length,
        north: (turn * (to.east - from.east) * inM) / length,
      };
      const at = (share: number) => ({
        east: from.east + (to.east - from.east) * share + inward.east,
        north: from.north + (to.north - from.north) * share + inward.north,
      });
      return stretches
        .filter((stretch) => stretch.wall)
        .map((stretch) => ({
          from: at(stretch.from),
          to: at(stretch.to),
          owner: { kind: 'roof', roof: index } as const,
        }));
    });
  });
}
