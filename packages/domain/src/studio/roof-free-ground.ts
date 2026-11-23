import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { movedIn } from './roof-cuts';
import { roofFormed } from './roof-forms';
import { belongsTo, roofKindOf, roofSidesOf, standsOn } from './roof-kind';
import { type RoofFacts, roofHasWalls, roofMaterialNow, roofShapeNow } from './roof-levels';
import { materialSlopeDeg } from './roof-material';
import { type EdgeStretch, edgesOf, parapetNow } from './roof-open-edges';
import {
  type FlatShape,
  farFromEdge,
  joinedAll,
  shapeOf,
  shapesArea,
  without,
} from './roof-polygons';

/**
 * A roof's free ground (`T-M05-002`, part e): its area, which leaves out its holes and what
 * stands on it; the area of every roof together, every spot once as seen from above; and the
 * setback line, in from the inside of the parapet (from the edge where there is none), round what
 * stands on the roof and along a taller wall, and not at all along a seam.
 */

const RADIANS = Math.PI / 180;
/** Two places this close are one, in metres. */
const SAME_M = 1e-4;

/** What is taken out of a roof's own ground: its holes, its separate parts, and what stands on it on walls. */
function takenOutOf(document: StudioDocument, index: number): Roof[] {
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

/** The area of every roof together, every spot once as seen from above; a hole is no roof. */
export function roofsAreaM2(document: StudioDocument): number {
  const shapes = (hole: boolean) =>
    document.roofs
      .filter((roof) => (roofKindOf(roof) === 'hole') === hole)
      .map((roof) => shapeOf(roof.corners));
  const all = joinedAll(shapes(false)) ?? [];
  return shapesArea(without(all, shapes(true)) ?? all);
}

/** A roof's one slope in degrees: what is stored, else its material's first slope; 0 when flat. */
export function roofSlopeDeg(roof: Roof, facts: RoofFacts): number {
  if (roofShapeNow(roof, facts) === 'flat') return 0;
  return roof.slope?.degrees ?? materialSlopeDeg(roofMaterialNow(roof), facts);
}

/**
 * A sloped roof's surface along its slope, in square metres: its own area from above, grown by
 * what its faces gain over theirs. A flat roof's is its area.
 */
export function roofSurfaceM2(document: StudioDocument, index: number, facts: RoofFacts): number {
  const roof = document.roofs[index];
  if (roof === undefined) return 0;
  const area = roofAreaM2(document, index);
  const shape = roofShapeNow(roof, facts);
  if (shape === 'flat' || shape === 'any') return area;
  const built = roofFormed(roof.corners, { shape, slopeDeg: roofSlopeDeg(roof, facts) });
  const above = built.faces.reduce((sum, face) => sum + face.areaM2, 0);
  const along = built.faces.reduce((sum, face) => sum + face.surfaceM2, 0);
  return above === 0 ? area : (area * along) / above;
}

/** One stretch of a ring's side and how far the setback line stands in from it. */
interface Piece {
  readonly from: GroundPoint;
  readonly to: GroundPoint;
  readonly inM: number;
}

const between = (a: GroundPoint, b: GroundPoint, share: number): GroundPoint => ({
  east: a.east + (b.east - a.east) * share,
  north: a.north + (b.north - a.north) * share,
});

/** The roof's own side a stretch of ground edge lies on; −1 when it lies on something standing on the roof. */
function sideUnder(roof: Roof, from: GroundPoint, to: GroundPoint): number {
  const middle = between(from, to, 0.5);
  return roof.corners.findIndex(
    (corner, i) =>
      farFromEdge(middle, [corner, roof.corners[(i + 1) % roof.corners.length] as GroundPoint]) <
      SAME_M,
  );
}

/** Where a point lies along a side, as a share of the side. */
function shareAlong(point: GroundPoint, from: GroundPoint, to: GroundPoint): number {
  const dx = to.east - from.east;
  const dy = to.north - from.north;
  const span = dx * dx + dy * dy;
  return span === 0 ? 0 : ((point.east - from.east) * dx + (point.north - from.north) * dy) / span;
}

/** The stretches of one ring, each with how far in the setback line stands from it. */
function piecesOf(
  document: StudioDocument,
  index: number,
  ring: readonly GroundPoint[],
  facts: RoofFacts,
  edges: readonly (readonly EdgeStretch[])[],
): Piece[] {
  const roof = document.roofs[index] as Roof;
  const parapet = parapetNow(document, roof, facts);
  const sides = roofSidesOf(roof);
  // On a sloped roof the setback is measured along the face: from above it is shorter.
  const along =
    facts.setbackMeasure === 'along_face' ? Math.cos(roofSlopeDeg(roof, facts) * RADIANS) : 1;
  const setback = (roof.setback?.metres ?? facts.setbackM) * along;
  const wallIn = parapet.lengthsMeasured === 'outside' ? parapet.thicknessM : 0;
  return ring.flatMap((from, i): Piece[] => {
    const to = ring[(i + 1) % ring.length] as GroundPoint;
    const side = sideUnder(roof, from, to);
    // A wall standing on the roof — a stair room's, a duct's parapet — is an edge like any other.
    if (side < 0) return [{ from, to, inM: setback }];
    const start = roof.corners[side] as GroundPoint;
    const end = roof.corners[(side + 1) % roof.corners.length] as GroundPoint;
    const own = (sides[side]?.setbackM ?? setback / along) * along;
    const [low, high] = [shareAlong(from, start, end), shareAlong(to, start, end)].sort(
      (a, b) => a - b,
    );
    return (edges[side] ?? []).flatMap((stretch): Piece[] => {
      const a = Math.max(stretch.from, low as number);
      const b = Math.min(stretch.to, high as number);
      if (b - a < SAME_M) return [];
      // A seam between two roofs of one height keeps no panel back; a wall is stood clear of.
      const inM = stretch.state === 'shared' ? 0 : own + (stretch.wall ? wallIn : 0);
      return [{ from: between(start, end, a), to: between(start, end, b), inM }];
    });
  });
}

/** Pieces put in the order of their ring, whichever way the side they lie on was drawn. */
function ordered(ring: readonly GroundPoint[], pieces: readonly Piece[]): Piece[] {
  return ring.flatMap((from, i) => {
    const to = ring[(i + 1) % ring.length] as GroundPoint;
    return pieces
      .filter((piece) => farFromEdge(between(piece.from, piece.to, 0.5), [from, to]) < SAME_M)
      .map((piece) =>
        shareAlong(piece.from, from, to) <= shareAlong(piece.to, from, to)
          ? piece
          : { from: piece.to, to: piece.from, inM: piece.inM },
      )
      .sort((a, b) => shareAlong(a.from, from, to) - shareAlong(b.from, from, to));
  });
}

/**
 * A roof's setback line, ring by ring: the ground panels may use lies inside the rings that run
 * anticlockwise and outside the ones that run clockwise.
 */
export function setbackLines(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
): GroundPoint[][] {
  if (document.roofs[index] === undefined) return [];
  const edges = edgesOf(document, index, facts);
  return roofGround(document, index).flatMap((ground) => {
    const lay = (ring: readonly GroundPoint[]) => {
      const pieces = ordered(ring, piecesOf(document, index, ring, facts, edges));
      return {
        corners: pieces.map((piece) => piece.from),
        distances: pieces.map((piece) => piece.inM),
      };
    };
    const outer = lay(ground.outer);
    return movedIn(outer.corners, outer.distances, ground.holes.map(lay));
  });
}
