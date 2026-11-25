import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofBuilt, roofSlopeDeg } from './roof-built';
import { facesWithout, movedIn } from './roof-cuts';
import type { FaceEdge } from './roof-faces';
import { roofGround, takenOutOf } from './roof-free-ground';
import { roofSidesOf } from './roof-kind';
import { type RoofFacts, roofSloped } from './roof-levels';
import { type EdgeStretch, edgesOf, parapetInM, parapetNow } from './roof-open-edges';
import { farFromEdge } from './roof-polygons';

/**
 * A roof's setback line (`T-M05-002`, part e): in from the inside of the parapet (from the edge
 * where there is none), round what stands on the roof and along a taller wall, and not at all along
 * a seam. A side with its own setback keeps it; on a sloped roof it is measured along the face, and
 * a market may give its own for each kind of edge.
 */

const RADIANS = Math.PI / 180;
/** Two places this close are one, in metres. */
const SAME_M = 1e-4;

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
  const wallIn = parapetInM(parapet);
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

/** The pack's setback for a kind of edge, where it gives one; else the roof's own. */
function setbackFor(kind: FaceEdge, own: number, facts: RoofFacts): number {
  const by = facts.setbackByEdge;
  if (kind === 'break') return 0;
  if (by === null) return own;
  if (kind === 'eave') return by.eave ?? own;
  if (kind === 'ridge') return by.ridge ?? own;
  if (kind === 'hip' || kind === 'valley') return by.hipOrValley ?? own;
  return kind === 'gable_end' ? (by.gableEnd ?? own) : own;
}

/** How far in the setback stands from one edge of a face, as seen from above. */
function faceEdgeIn(
  roof: Roof,
  edges: readonly (readonly EdgeStretch[])[],
  wallIn: number,
  facts: RoofFacts,
  edge: { readonly from: GroundPoint; readonly to: GroundPoint; readonly kind: FaceEdge },
): number {
  const own = roof.setback?.metres ?? facts.setbackM;
  const side = sideUnder(roof, edge.from, edge.to);
  // A ridge, a hip, a valley, or the wall of something cut out of the face.
  if (side < 0) return setbackFor(edge.kind, own, facts);
  const stretches = edges[side] ?? [];
  // A seam between two roofs of one height keeps no panel back.
  if (stretches.length > 0 && stretches.every((stretch) => stretch.state === 'shared')) return 0;
  const base = roofSidesOf(roof)[side]?.setbackM ?? setbackFor(edge.kind, own, facts);
  return base + (stretches.some((stretch) => stretch.wall) ? wallIn : 0);
}

/**
 * A sloped roof's setback lines face by face, where the market gives a setback for each kind of
 * edge — an eave, a ridge, a hip or a valley, a gable end — as fire rules do. What is cut out of
 * the roof and what stands on it is cut out of its faces first, so the line runs round each; a
 * side's own setback, a seam and a parapet's thickness count as they do on a flat roof.
 */
function faceSetbackLines(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
): GroundPoint[][] {
  const roof = document.roofs[index] as Roof;
  const own = roof.setback?.metres ?? facts.setbackM;
  const parapet = parapetNow(document, roof, facts);
  const wallIn = parapetInM(parapet);
  const edges = edgesOf(document, index, facts);
  let faces = roofBuilt(roof, facts).faces;
  for (const out of takenOutOf(document, index)) faces = facesWithout(faces, out.corners);
  return faces.flatMap((face) => {
    // On a sloped roof the setback is measured along the face: from above it is shorter.
    const along = facts.setbackMeasure === 'along_face' ? Math.cos(face.slopeDeg * RADIANS) : 1;
    const distances = face.corners.map((from, i) => {
      const to = face.corners[(i + 1) % face.corners.length] as GroundPoint;
      return (
        faceEdgeIn(roof, edges, wallIn, facts, { from, to, kind: face.edges[i] ?? 'eave' }) * along
      );
    });
    const holes = (face.holes ?? []).map((hole) => ({
      corners: hole,
      distances: hole.map(() => own * along),
    }));
    return movedIn(face.corners, distances, holes);
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
  const roof = document.roofs[index];
  if (roof === undefined) return [];
  if (facts.setbackByEdge !== null && roofSloped(roof, facts)) {
    return faceSetbackLines(document, index, facts);
  }
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
