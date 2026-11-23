import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { belongsTo, standsOn } from './roof-kind';
import { pointInside, roofArea } from './roof-shape';

/**
 * Which roof a tap picks in the top view (`T-M05-002`, part e), where roofs lie on roofs: the first
 * tap always picks, and never changes a wall.
 */

/** How many roofs lie under a roof, by the roof it stands on or is part of. */
function depthOf(document: StudioDocument, index: number): number {
  let depth = 0;
  let roof = document.roofs[index];
  // A ring of links in a design from elsewhere ends at the count of its roofs.
  while (roof !== undefined && depth < document.roofs.length) {
    const under = standsOn(document, roof) ?? belongsTo(document, roof);
    if (under === null) break;
    roof = document.roofs[under];
    depth += 1;
  }
  return depth;
}

/**
 * The roof a tap picks, of the roofs the point lies in: the top one first — a roof that stands on
 * another before the roof under it, then the smaller, then the last drawn. A tap where the picked
 * roof lies picks the next one under it, and round again. `null` on open ground.
 */
export function roofPickedAt(
  document: StudioDocument,
  at: GroundPoint,
  picked: number | null,
): number | null {
  const under = document.roofs
    .map((_, index) => index)
    .filter((index) => pointInside(at, (document.roofs[index] as Roof).corners));
  const area = (index: number) => roofArea((document.roofs[index] as Roof).corners);
  under.sort((a, b) => depthOf(document, b) - depthOf(document, a) || area(a) - area(b) || b - a);
  if (under.length === 0) return null;
  const now = picked === null ? -1 : under.indexOf(picked);
  return under[(now + 1) % under.length] ?? null;
}
