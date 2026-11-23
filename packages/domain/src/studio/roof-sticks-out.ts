import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { belongsTo, standsOn } from './roof-kind';
import { cornerAfter, distanceToSegment, pointInside, roofsOverlap } from './roof-shape';

/**
 * A roof past the edge of the roof it stands on (`T-M05-002`, part e): after a person drags it half
 * out, or makes the roof under it smaller. Nothing jumps back and nothing is refused: what sticks
 * out is marked to check. A roof dragged clear of its roof is its own roof again.
 */

/** Less than this past the edge is on it, in metres. */
export const STICKS_OUT_MIN_M = 0.01;

/** The roof this one lies on or in: the one it stands on, else the one it is part of. */
function holderOf(document: StudioDocument, roof: Roof): Roof | null {
  const index = standsOn(document, roof) ?? belongsTo(document, roof);
  return index === null ? null : (document.roofs[index] ?? null);
}

/** How far a point lies outside an outline, in metres; 0 inside it or on it. */
function outsideM(point: GroundPoint, outline: readonly GroundPoint[]): number {
  if (pointInside(point, outline)) return 0;
  return Math.min(
    ...outline.map((from, i) => distanceToSegment(point, from, cornerAfter(outline, i))),
  );
}

/**
 * How far the roof at `index` sticks out past the roof it lies on, in metres, and where: the
 * farthest of its corners and the middles of its sides. 0 for a roof on the ground, and for one
 * within its roof.
 */
export function sticksOutFarthest(
  document: StudioDocument,
  index: number,
): { readonly metres: number; readonly at: GroundPoint | null } {
  const roof = document.roofs[index];
  const holder = roof === undefined ? null : holderOf(document, roof);
  if (roof === undefined || holder === null) return { metres: 0, at: null };
  const middles = roof.corners.map((from, i) => {
    const to = cornerAfter(roof.corners, i);
    return { east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 };
  });
  const far = [...roof.corners, ...middles]
    .map((at) => ({ at, metres: outsideM(at, holder.corners) }))
    .reduce((best, each) => (each.metres > best.metres ? each : best));
  return far.metres < STICKS_OUT_MIN_M ? { metres: 0, at: null } : far;
}

export function sticksOutM(document: StudioDocument, index: number): number {
  return sticksOutFarthest(document, index).metres;
}

/** The first roof that sticks out farther after an edit than before it; `null` when none does. */
export function stuckOutBy(before: StudioDocument, after: StudioDocument): number | null {
  const found = after.roofs.findIndex((roof, index) => {
    const was = before.roofs.findIndex((other) => other.id === roof.id);
    return sticksOutM(after, index) > (was < 0 ? 0 : sticksOutM(before, was)) + STICKS_OUT_MIN_M;
  });
  return found < 0 ? null : found;
}

/**
 * The roof at `index` once a person has moved it: clear of the roof it lay on, with no ground over
 * it, it is its own roof — no kind, no link, and a height no person set goes back to the ground's.
 * Still over that roof, or on the ground already, it stays as it is.
 */
export function roofSetFree(document: StudioDocument, index: number): StudioDocument {
  const roof = document.roofs[index];
  const holder = roof === undefined ? null : holderOf(document, roof);
  if (roof === undefined || holder === null) return document;
  if (roofsOverlap(roof.corners, holder.corners)) return document;
  const { kind: _kind, on: _on, partOf: _partOf, ...rest } = roof;
  const free: Roof = { ...rest, height: roof.height?.setBy === 'person' ? roof.height : null };
  return { ...document, roofs: document.roofs.map((each, i) => (i === index ? free : each)) };
}
