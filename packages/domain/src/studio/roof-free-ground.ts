import type { Roof, StudioDocument } from './document';
import { roofBuilt } from './roof-built';
import { belongsTo, roofKindOf, standsOn } from './roof-kind';
import { type RoofFacts, roofHasWalls } from './roof-levels';
import { type FlatShape, joinedAll, shapeOf, shapesArea, without } from './roof-polygons';

/**
 * A roof's free ground (`T-M05-002`, part e): its area, which leaves out its holes and what
 * stands on it; the area of every roof together, every spot once as seen from above; and a sloped
 * roof's surface along its slope.
 */

/** What is taken out of a roof's own ground: its holes, its separate parts, and what stands on it on walls. */
export function takenOutOf(document: StudioDocument, index: number): Roof[] {
  return document.roofs.filter((other, at) => {
    if (at === index) return false;
    const kind = roofKindOf(other);
    if (kind === 'hole' || kind === 'separate_part') return belongsTo(document, other) === index;
    // A roof covered by an open shed keeps its own area.
    return standsOn(document, other) === index && roofHasWalls(other);
  });
}

/** A roof's own ground: its outline without what is taken out of it. */
export function roofGround(document: StudioDocument, index: number): FlatShape[] {
  const roof = document.roofs[index];
  if (roof === undefined) return [];
  const out = takenOutOf(document, index).map((other) => shapeOf(other.corners));
  return without([shapeOf(roof.corners)], out) ?? [shapeOf(roof.corners)];
}

/** A roof's own area as seen from above, in square metres. */
export function roofAreaM2(document: StudioDocument, index: number): number {
  return shapesArea(roofGround(document, index));
}

/**
 * The area of every roof together, every spot once as seen from above. A hole is no roof, save
 * where another roof lies over it or shows through it: from above that spot is roof.
 */
export function roofsAreaM2(document: StudioDocument): number {
  const roofs = document.roofs.map((roof, index) => ({ roof, index }));
  const solid = roofs.filter(({ roof }) => roofKindOf(roof) !== 'hole');
  const all = joinedAll(solid.map(({ roof }) => shapeOf(roof.corners))) ?? [];
  const open = roofs
    .filter(({ roof }) => roofKindOf(roof) === 'hole')
    .flatMap(({ roof }) => {
      // The roof the hole is cut in does not cover it; nor does the roof that one is carved out of.
      const cutIn = belongsTo(document, roof);
      const part = cutIn === null ? undefined : document.roofs[cutIn];
      const carvedFrom =
        part !== undefined && roofKindOf(part) === 'separate_part'
          ? belongsTo(document, part)
          : null;
      const others = solid.filter(({ index }) => index !== cutIn && index !== carvedFrom);
      return (
        without(
          [shapeOf(roof.corners)],
          others.map((other) => shapeOf(other.roof.corners)),
        ) ?? []
      );
    });
  return shapesArea(without(all, open) ?? all);
}

/**
 * A sloped roof's surface along its slope, in square metres: its own area from above, grown by
 * what its faces gain over theirs. A flat roof's is its area.
 */
export function roofSurfaceM2(document: StudioDocument, index: number, facts: RoofFacts): number {
  const roof = document.roofs[index];
  if (roof === undefined) return 0;
  const area = roofAreaM2(document, index);
  const built = roofBuilt(roof, facts);
  const above = built.faces.reduce((sum, face) => sum + face.areaM2, 0);
  const along = built.faces.reduce((sum, face) => sum + face.surfaceM2, 0);
  return above === 0 ? area : (area * along) / above;
}
