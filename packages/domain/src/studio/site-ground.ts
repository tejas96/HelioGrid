import type { GroundPoint } from './ground';
import { pointInside, roofMiddle } from './roof-shape';
import {
  cellsInBox,
  distanceToRing,
  type GridCell,
  type HeightGrid,
  type MaskGrid,
  onBuilding,
  percentile,
  ringBox,
} from './site-grid';
import { planeFitTwice, planeHeightAt } from './site-plane';

/**
 * The ground a building stands on (`T-M05-002`, part g), read per building and never once for a
 * site, since a hill site's houses stand at different grounds: the open cells in a ring round it,
 * their slope taken out (on a hill the low share alone would read the downhill side), then a low
 * share of what is left, as trees and cars lift the middle, at the building's middle. Joined row houses have no open ring, so the
 * lowest open cells within the street's reach stand in; with none, the caller falls back to the
 * market's plinth, assumed.
 */

/** The ring round a building whose open cells are its ground: 2 to 15 m out. */
const RING_FROM_M = 2;
const RING_TO_M = 15;
/** How far a row house looks for open ground: across the street. */
const STREET_REACH_M = 30;
/** A ring with fewer open cells than this is no ring: the street is read instead. */
const GROUND_CELLS_MIN = 20;
/** The share up the open cells the ground is read at: low, as trees and cars stand on it. */
const RING_SHARE = 0.1;
/** Down a street the very lowest cells are the road's. */
const STREET_SHARE = 0.05;

/** The ground under a building outline on the grid's datum; `null` where no open cell is near. */
export function groundUnder(
  grid: HeightGrid,
  mask: MaskGrid,
  outline: readonly GroundPoint[],
): number | null {
  if (outline.length < 3) return null;
  const ring: GridCell[] = [];
  const street: number[] = [];
  for (const cell of cellsInBox(grid, ringBox(outline, STREET_REACH_M))) {
    if (onBuilding(mask, cell) || pointInside(cell, outline)) continue;
    const away = distanceToRing(cell, outline);
    if (away > STREET_REACH_M) continue;
    street.push(cell.height);
    if (away >= RING_FROM_M && away <= RING_TO_M) ring.push(cell);
  }
  if (ring.length >= GROUND_CELLS_MIN) return ringGround(ring, outline);
  if (street.length > 0) return percentile(street, STREET_SHARE);
  return null;
}

/** The ring's ground at the building's middle: its slope taken out, then a low share of the rest. */
function ringGround(ring: readonly GridCell[], outline: readonly GroundPoint[]): number {
  const slope = planeFitTwice(ring);
  if (slope === null) {
    return percentile(
      ring.map((cell) => cell.height),
      RING_SHARE,
    );
  }
  const off = ring.map((cell) => cell.height - planeHeightAt(slope, cell));
  return planeHeightAt(slope, roofMiddle(outline)) + percentile(off, RING_SHARE);
}
