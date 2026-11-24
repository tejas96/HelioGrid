import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofBuilt } from './roof-built';
import { belongsTo, roofKindOf, standsOn } from './roof-kind';
import { LEVEL_M, type RoofFacts, roofHasWalls, roofSloped, roofTopsM } from './roof-levels';
import { roofNameOf } from './roof-names';
import { edgesOf } from './roof-open-edges';
import { farApart, shapeOf, shared, stretchesTaken } from './roof-polygons';
import type { RoofCrossing } from './roof-sheet-rows';
import { STICKS_OUT_MIN_M, sticksOutM } from './roof-sticks-out';

/**
 * What a roof crosses as it is changed (`T-M05-002`, part e, E131, board 10.3): its walls rising
 * above a roof standing on it, its ridge through a higher roof it meets, its top sunk below the
 * parapet of the roof it stands on, or a part of it past its roof's edge. Each is allowed and
 * marked to check, never refused: the screen lights what is crossed and names it.
 */

const nameOf = (document: StudioDocument, index: number) =>
  roofNameOf(document, index) ?? { kind: 'roof' as const, number: index + 1 };

/** The highest wall a roof has, above its floor; 0 with none. */
function wallTopM(document: StudioDocument, index: number, facts: RoofFacts): number {
  const walls = edgesOf(document, index, facts)
    .flat()
    .filter((stretch) => stretch.wall)
    .map((stretch) => stretch.metres);
  return walls.length === 0 ? 0 : Math.max(...walls);
}

/** Two roofs whose outlines overlap, or meet along an edge, seen from above. */
function touching(a: Roof, b: Roof): boolean {
  if (farApart(a.corners, b.corners)) return false;
  if ((shared([shapeOf(a.corners)], [shapeOf(b.corners)]) ?? []).length > 0) return true;
  return a.corners.some(
    (from, i) =>
      stretchesTaken(from, a.corners[(i + 1) % a.corners.length] as GroundPoint, b.corners).length >
      0,
  );
}

export function roofCrossingsOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
): RoofCrossing[] {
  const roof = document.roofs[index];
  if (roof === undefined || roofKindOf(roof) === 'hole') return [];
  const tops = roofTopsM(document, facts);
  const top = tops[index] ?? 0;
  const found: RoofCrossing[] = [];
  // Its walls above a roof standing on it: a parapet taller than the stair room beside it.
  const wallTop = top + wallTopM(document, index, facts);
  document.roofs.forEach((other, at) => {
    if (at === index || standsOn(document, other) !== index || !roofHasWalls(other)) return;
    if (wallTop > (tops[at] ?? 0) + LEVEL_M)
      found.push({ kind: 'wall_above', roof: at, name: nameOf(document, at) });
  });
  // Its ridge through a higher roof it meets.
  if (roofSloped(roof, facts)) {
    const ridgeM = top + roofBuilt(roof, facts).topM;
    document.roofs.forEach((other, at) => {
      if (at === index || belongsTo(document, other) === index || roofKindOf(other) === 'hole')
        return;
      const otherTop = tops[at] ?? 0;
      if (otherTop > top + LEVEL_M && ridgeM > otherTop + LEVEL_M && touching(roof, other)) {
        found.push({ kind: 'ridge_through', roof: at, name: nameOf(document, at) });
      }
    });
  }
  // Its top below the parapet of the roof it stands on.
  const holder = standsOn(document, roof);
  if (holder !== null) {
    const parapetTop = (tops[holder] ?? 0) + wallTopM(document, holder, facts);
    if (top < parapetTop - LEVEL_M) {
      found.push({ kind: 'sunk', roof: holder, name: nameOf(document, holder) });
    }
  }
  // A part of it past its roof's edge.
  const held = belongsTo(document, roof);
  if (held !== null && sticksOutM(document, index) >= STICKS_OUT_MIN_M) {
    found.push({ kind: 'past_edge', roof: held, name: nameOf(document, held) });
  }
  return found;
}
