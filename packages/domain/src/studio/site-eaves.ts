import type { GroundPoint } from './ground';
import type { SiteEave } from './site-data';
import { type HeightGrid, heightAt, median } from './site-grid';

/**
 * A building's eaves (`T-M05-002`, part g): the outline's edges where the height falls to the
 * ground just outside them. A tree's crown over a wall is never an eave — under it the height
 * stays up — so a tree cannot pull a drawn corner.
 */

/** How far in and out of the edge the height is read. */
const READ_OFF_EDGE_M = 0.6;
/** One reading along the edge each this many metres. */
const READ_EVERY_M = 0.5;
/** Inside, a roof stands at least this high above its ground… */
const ROOF_ABOVE_M = 2;
/** …and outside, the ground is within this of the ground. */
const GROUND_WITHIN_M = 1;
/** An edge is an eave where this share of its readings fall. */
const EAVE_SHARE = 0.6;
/** An edge shorter than this is a jog, never an eave. */
const EAVE_LENGTH_MIN_M = 1.5;
const CM = 100;

function ringTurnsLeft(ring: readonly GroundPoint[]): boolean {
  let twice = 0;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length] as GroundPoint;
    twice += a.east * b.north - b.east * a.north;
  });
  return twice > 0;
}

/** The outline's eaves, each with the roof's height along it above `groundM`. */
export function eavesOf(
  grid: HeightGrid,
  outline: readonly GroundPoint[],
  groundM: number,
): SiteEave[] {
  const left = ringTurnsLeft(outline);
  const eaves: SiteEave[] = [];
  outline.forEach((from, i) => {
    const to = outline[(i + 1) % outline.length] as GroundPoint;
    const eave = eaveAlong(grid, from, to, left, groundM);
    if (eave !== null) eaves.push(eave);
  });
  return eaves;
}

/** The wall from `from` to `to` as an eave, or `null` where the roof does not fall off it. */
function eaveAlong(
  grid: HeightGrid,
  from: GroundPoint,
  to: GroundPoint,
  left: boolean,
  groundM: number,
): SiteEave | null {
  const length = Math.hypot(to.east - from.east, to.north - from.north);
  if (length < EAVE_LENGTH_MIN_M) return null;
  const alongE = (to.east - from.east) / length;
  const alongN = (to.north - from.north) / length;
  // Inward: the left of the way along a ring that turns left.
  const inE = (left ? -alongN : alongN) * READ_OFF_EDGE_M;
  const inN = (left ? alongE : -alongE) * READ_OFF_EDGE_M;
  const reads = Math.max(2, Math.floor(length / READ_EVERY_M));
  const roof: number[] = [];
  for (let k = 0; k < reads; k += 1) {
    const t = (k + 0.5) / reads;
    const east = from.east + (to.east - from.east) * t;
    const north = from.north + (to.north - from.north) * t;
    const inside = heightAt(grid, { east: east + inE, north: north + inN }) - groundM;
    const outside = heightAt(grid, { east: east - inE, north: north - inN }) - groundM;
    // A reading with no data on either side falls nowhere (NaN compares false).
    if (inside >= ROOF_ABOVE_M && outside <= GROUND_WITHIN_M) roof.push(inside);
  }
  if (roof.length / reads < EAVE_SHARE) return null;
  return { from, to, heightM: Math.round(median(roof) * CM) / CM };
}
