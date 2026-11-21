import {
  PICTURE_SCALE_MAX,
  PICTURE_SCALE_MIN,
  type RoofEdgeTrust,
  type SetEdgeTrust,
  type StudioDocument,
} from './document';
import type { GroundPoint } from './ground';
import { type EditResult, faultOf, roofAt, withRoof } from './roof-check';
import { SQUARE_EXACT_DEGREES } from './roof-draw';
import { between, CORNER_GAP_M, cornerAfter, cornerAngle, edgeLengths } from './roof-shape';

/**
 * A roof edge's true length (`T-M05-002`, part b): the first in a design sizes the picture and
 * every roof on it; a later one fixes only its own edge, and never changes a length a person set.
 */

/** A true length may be no shorter than the gap between two corners, and no longer than 999 m. */
export const LENGTH_MIN_M = CORNER_GAP_M;
export const LENGTH_MAX_M = 999;
/** A typed length this far off the traced one asks once before it is used. */
export const LENGTH_ASK_SHARE = 0.25;
/** Two lengths within a millimetre are one: a typed length "holds" within it. */
const HOLD_M = 1e-3;

/** Whether no length in the design is typed or measured yet: the next one sizes everything. */
export function lengthIsFirst(document: StudioDocument): boolean {
  return document.roofs.every((roof) => roof.edges.every((trust) => trust === 'traced'));
}

/** Whether a typed length is far enough off the traced one to ask once before it is used. */
export function lengthAsks(traced: number, typed: number): boolean {
  return traced > 0 && Math.abs(typed / traced - 1) > LENGTH_ASK_SHARE + 1e-9;
}

function scaledAboutPin(point: GroundPoint, k: number): GroundPoint {
  return { east: point.east * k, north: point.north * k };
}

/** Which end of an edge takes a new length: both from the middle, or one end while the other stays. */
const LENGTH_WAYS = [
  { start: -0.5, end: 0.5 },
  { start: 0, end: 1 },
  { start: -1, end: 0 },
] as const;

/**
 * The corners after edge `edge` takes `metres`, one way: each end that moves slides along the edge,
 * and at a square corner the neighbour edge slides with it, so a square corner stays square.
 */
function stretched(
  corners: readonly GroundPoint[],
  edge: number,
  metres: number,
  way: (typeof LENGTH_WAYS)[number],
): GroundPoint[] {
  const count = corners.length;
  const start = corners[edge] as GroundPoint;
  const end = cornerAfter(corners, edge);
  const reach = between(start, end);
  const change = metres - reach;
  const unit = { east: (end.east - start.east) / reach, north: (end.north - start.north) / reach };
  const shift = new Map<number, number>();
  const push = (corner: number, by: number) => {
    if (by === 0) return;
    shift.set(corner, (shift.get(corner) ?? 0) + by);
  };
  const ends = [
    { corner: edge, by: way.start * change, neighbour: (edge - 1 + count) % count },
    { corner: (edge + 1) % count, by: way.end * change, neighbour: (edge + 2) % count },
  ];
  for (const { corner, by, neighbour } of ends) {
    push(corner, by);
    if (by !== 0 && Math.abs(cornerAngle(corners, corner) - 90) <= SQUARE_EXACT_DEGREES) {
      push(neighbour, by);
    }
  }
  return corners.map((corner, i) => {
    const by = shift.get(i) ?? 0;
    return { east: corner.east + unit.east * by, north: corner.north + unit.north * by };
  });
}

/**
 * The first true length: every corner of every roof, and the picture, stretched `k` times about
 * the pin; refused when the picture would stretch past five times or shrink past a fifth.
 */
function firstLengthSet(
  document: StudioDocument,
  roofIndex: number,
  edges: readonly RoofEdgeTrust[],
  k: number,
): EditResult {
  const pictureScale = document.pictureScale * k;
  if (pictureScale < PICTURE_SCALE_MIN || pictureScale > PICTURE_SCALE_MAX) {
    return { kind: 'refused', refusal: 'scale_out_of_range' };
  }
  const roofs = document.roofs.map((r, i) => ({
    ...r,
    corners: r.corners.map((corner) => scaledAboutPin(corner, k)),
    edges: i === roofIndex ? edges : r.edges,
  }));
  const scaled = { ...document, roofs, pictureScale };
  // Every roof grows with the picture: each must stay inside the site's reach.
  for (const [i, roof] of roofs.entries()) {
    const fault = faultOf(scaled, i, roof.corners);
    if (fault !== null) return { kind: 'refused', refusal: fault };
  }
  return { kind: 'done', document: scaled };
}

/**
 * A true length for one edge. The first in a design sizes the picture and every roof on it about the
 * pin. A later one changes only its own edge, from its middle; when that would change a typed or
 * measured length elsewhere, one end stays and the other takes the change; when neither can, it is
 * refused naming the length that blocks.
 */
export function lengthSet(
  document: StudioDocument,
  roofIndex: number,
  edge: number,
  metres: number,
  trust: SetEdgeTrust,
): EditResult {
  if (metres < LENGTH_MIN_M) return { kind: 'refused', refusal: 'too_short' };
  if (metres > LENGTH_MAX_M) return { kind: 'refused', refusal: 'too_long' };
  const roof = roofAt(document, roofIndex);
  const edges = roof.edges.map((t, i) => (i === edge ? trust : t));
  const traced = edgeLengths(roof.corners)[edge] ?? 0;
  if (lengthIsFirst(document)) {
    return firstLengthSet(document, roofIndex, edges, metres / traced);
  }
  const before = edgeLengths(roof.corners);
  let blocking: number | null = null;
  for (const way of LENGTH_WAYS) {
    const corners = stretched(roof.corners, edge, metres, way);
    const after = edgeLengths(corners);
    const held = roof.edges.findIndex(
      (t, i) =>
        i !== edge && t !== 'traced' && Math.abs((after[i] ?? 0) - (before[i] ?? 0)) > HOLD_M,
    );
    if (held !== -1) {
      blocking ??= held;
      continue;
    }
    const fault = faultOf(document, roofIndex, corners);
    if (fault !== null) return { kind: 'refused', refusal: fault };
    return { kind: 'done', document: withRoof(document, roofIndex, { ...roof, corners, edges }) };
  }
  return { kind: 'refused', refusal: 'held_length', edge: blocking ?? edge };
}
