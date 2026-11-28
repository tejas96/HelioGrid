import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { distanceToSegment, pointInside } from './roof-shape';
import { type SnapTargets, snapTargetsOf } from './roof-snap';
import { EDGE_SLACK_M, outlinesApart, SAME_BUILDING_M } from './roof-touch';

/**
 * The house in hand (`T-M05-002`, parts b and e): the magnet guides a corner by the roofs of the
 * house it is drawn, dragged or moved on alone. A roof of another building gives nothing — no
 * corner, no wall, no line across the map — so drawing beside a roof already drawn is never pulled
 * onto it. The house is read from the spots in hand: a roof a spot is on or inside is in it, and
 * with it every roof that touches one in it, within 30 cm, the way LiDAR reads a building.
 */

/** A corner this near a roof's wall stands on it: the snap put it there, and a lane is wider. */
export const IN_HAND_M = SAME_BUILDING_M;

/**
 * What finds the house: spots that bring in a roof they are on (within `within`) or inside — a
 * drawing's corners, or the pen before the first — or the outline of the roof in hand, which brings
 * in the roofs within `within` of it: the magnet's reach while it is dragged or moved, so the pull
 * reaches as far as ever on its own house.
 */
export type InHandSeed =
  | { readonly spots: readonly GroundPoint[]; readonly within: number }
  | { readonly ring: readonly GroundPoint[]; readonly within: number };

interface Box {
  readonly west: number;
  readonly east: number;
  readonly south: number;
  readonly north: number;
}

function boxOf(points: readonly GroundPoint[], pad: number): Box {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const p of points) {
    west = Math.min(west, p.east);
    east = Math.max(east, p.east);
    south = Math.min(south, p.north);
    north = Math.max(north, p.north);
  }
  return { west: west - pad, east: east + pad, south: south - pad, north: north + pad };
}

const boxesMeet = (a: Box, b: Box) =>
  a.west <= b.east && b.west <= a.east && a.south <= b.north && b.south <= a.north;

/** Whether a spot is inside an outline or within `within` of one of its walls. */
function onOrIn(point: GroundPoint, ring: readonly GroundPoint[], within: number): boolean {
  if (ring.length >= 3 && pointInside(point, ring)) return true;
  return ring.some(
    (from, i) =>
      distanceToSegment(point, from, ring[(i + 1) % ring.length] as GroundPoint) <= within,
  );
}

/** Whether two outlines are within `metres`: the box first, so a site of many is narrowed at once. */
const near = (
  a: readonly GroundPoint[],
  boxA: Box,
  b: readonly GroundPoint[],
  boxB: Box,
  metres: number,
) =>
  a.length > 0 &&
  b.length > 0 &&
  boxesMeet(boxA, boxB) &&
  outlinesApart(a, b) <= metres + EDGE_SLACK_M;

/** Whether two outlines touch, within 30 cm: one building. */
const touch = (a: readonly GroundPoint[], boxA: Box, b: readonly GroundPoint[], boxB: Box) =>
  near(a, boxA, b, boxB, SAME_BUILDING_M);

type Shapes = ReadonlyMap<number, { readonly ring: readonly GroundPoint[]; readonly box: Box }>;

/** The roofs a seed brings in by itself. */
function seeded(shapes: Shapes, seed: InHandSeed): number[] {
  const found: number[] = [];
  if ('ring' in seed) {
    if (seed.ring.length === 0) return found;
    const box = boxOf(seed.ring, seed.within);
    for (const [index, { ring, box: other }] of shapes)
      if (near(seed.ring, box, ring, other, seed.within)) found.push(index);
    return found;
  }
  if (seed.spots.length === 0) return found;
  const box = boxOf(seed.spots, seed.within);
  for (const [index, { ring, box: other }] of shapes)
    if (boxesMeet(box, other) && seed.spots.some((spot) => onOrIn(spot, ring, seed.within)))
      found.push(index);
  return found;
}

/** The roofs of the house in hand, by index: never `except`, the roof in hand itself. */
export function roofsInHand(
  document: StudioDocument,
  seed: InHandSeed,
  except?: number,
): ReadonlySet<number> {
  const shapes = new Map<number, { ring: readonly GroundPoint[]; box: Box }>();
  document.roofs.forEach((roof, index) => {
    if (index !== except && roof.corners.length > 0)
      shapes.set(index, { ring: roof.corners, box: boxOf(roof.corners, SAME_BUILDING_M) });
  });
  const toDo = seeded(shapes, seed);
  const found = new Set(toDo);
  for (let index = toDo.pop(); index !== undefined; index = toDo.pop()) {
    const shape = shapes.get(index) as { ring: readonly GroundPoint[]; box: Box };
    for (const [other, { ring, box }] of shapes) {
      if (found.has(other) || !touch(shape.ring, shape.box, ring, box)) continue;
      found.add(other);
      toDo.push(other);
    }
  }
  return found;
}

/** The snap targets of the house in hand: its roofs' corners and walls, all but `except`'s. */
export function inHandTargets(
  document: StudioDocument,
  seed: InHandSeed,
  except?: number,
): SnapTargets {
  const roofs = roofsInHand(document, seed, except);
  const all = snapTargetsOf(document.roofs, except);
  return {
    corners: all.corners.filter(({ owner }) => roofs.has(owner.roof)),
    edges: all.edges.filter(({ owner }) => roofs.has(owner.roof)),
  };
}
