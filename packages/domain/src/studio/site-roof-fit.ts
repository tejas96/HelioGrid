import type { GroundPoint } from './ground';
import { cellsInside, type HeightGrid, median, percentile } from './site-grid';
import {
  PLANE_CELLS_MIN,
  planeFacingDeg,
  planeFitTwice,
  planeHeightAt,
  planeSlopeDeg,
} from './site-plane';

/**
 * What the height map says a drawn roof is (`T-M05-002`, part g): its height above its building's
 * ground, its slope and the way it faces, and whether the map is clear enough to trust plainly.
 */
export type RoofFit =
  | {
      readonly kind: 'roof';
      /** A flat roof's deck, or a sloped roof's eave: metres above its ground. */
      readonly heightM: number;
      readonly slopeDeg: number;
      /** The compass bearing it slopes down toward; `null` for a flat roof. */
      readonly facingDeg: number | null;
      readonly rmseM: number;
      /** The map is clear here: the roof's sheet says nothing of it. */
      readonly clear: boolean;
    }
  /** The map holds no building inside the roof: the changed-roof question is asked at once. */
  | { readonly kind: 'no_building' };

/** A plane that lies further off its cells than this is "unclear here" (`T-M05-002`, part g). */
export const FIT_CLEAR_RMSE_M = 0.35;
/** A slope under this is a flat deck: concrete drains at 1 to 3°, and edge cells add a degree. */
const FLAT_SLOPE_MAX_DEG = 5;
/** Parapets and edge cells stand in this band: a flat deck is read inside it. */
const EDGE_INSET_M = 0.5;
/** A cell this far above a flat deck is a tank or a stair room on it, never the deck. */
const BUMP_M = 0.6;
/** A roof whose middle stands under this above the ground has no building under it. */
const BUILDING_MIN_M = 1;
const CM = 100;
const TENTHS = 10;
const TURN = 360;

const toCm = (metres: number) => Math.round(metres * CM) / CM;
const toTenth = (degrees: number) => Math.round(degrees * TENTHS) / TENTHS;

/**
 * The roof as the height map sees it, `groundM` its building's ground on the grid's datum; `null`
 * where the map holds too few cells inside it. A flat deck is the middle of its cells inside the
 * edge band with the bumps on it left out; a sloped roof's height is its eave, the plane at its
 * lowest corner. A plane the map does not read clearly is still the best value there is: it keeps
 * its slope and facing, and says it is unclear.
 */
export function roofFitOf(
  grid: HeightGrid,
  corners: readonly GroundPoint[],
  groundM: number,
): RoofFit | null {
  const inset = cellsInside(grid, corners, EDGE_INSET_M);
  const cells = inset.length >= PLANE_CELLS_MIN ? inset : cellsInside(grid, corners);
  if (cells.length < PLANE_CELLS_MIN) return null;
  if (median(cells.map((cell) => cell.height)) - groundM < BUILDING_MIN_M) {
    return { kind: 'no_building' };
  }
  const plane = planeFitTwice(cells);
  if (plane === null) return null;
  const clear = plane.rmseM < FIT_CLEAR_RMSE_M;
  const slopeDeg = planeSlopeDeg(plane);
  if (slopeDeg < FLAT_SLOPE_MAX_DEG) {
    const deck = cells.filter((cell) => cell.height - planeHeightAt(plane, cell) <= BUMP_M);
    const heights = (deck.length >= PLANE_CELLS_MIN ? deck : cells).map((cell) => cell.height);
    return {
      kind: 'roof',
      heightM: toCm(Math.max(0, median(heights) - groundM)),
      slopeDeg: 0,
      facingDeg: null,
      rmseM: toCm(plane.rmseM),
      clear,
    };
  }
  const eave = Math.min(...corners.map((corner) => planeHeightAt(plane, corner)));
  return {
    kind: 'roof',
    heightM: toCm(Math.max(0, eave - groundM)),
    slopeDeg: toTenth(slopeDeg),
    facingDeg: (() => {
      const facing = planeFacingDeg(plane);
      return facing === null ? null : Math.round(facing) % TURN;
    })(),
    rmseM: toCm(plane.rmseM),
    clear,
  };
}

/**
 * The height map's own height inside a roof, above its ground — what the fit check says the map
 * reads there, bumps and all; `null` where the map holds too few cells inside it.
 */
export function mapHeightInside(
  grid: HeightGrid,
  corners: readonly GroundPoint[],
  groundM: number,
): number | null {
  const cells = cellsInside(grid, corners, EDGE_INSET_M);
  if (cells.length < PLANE_CELLS_MIN) return null;
  return toCm(
    percentile(
      cells.map((cell) => cell.height),
      0.5,
    ) - groundM,
  );
}
