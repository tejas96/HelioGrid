import type { GroundPoint } from './ground';
import { cellsInside, type GridCell, type HeightGrid, median, percentile } from './site-grid';
import {
  PLANE_CELLS_MIN,
  type PlaneFit,
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
/**
 * Two decks under one outline — a tower and its annex — never a slope: the heights fall in groups
 * with an empty run between, the walls' few cells aside. Heights are counted in bins this tall; a
 * bin holding under this share of the fullest one is empty; groups this far apart are two decks.
 */
const LEVEL_BIN_M = 0.5;
const LEVEL_EMPTY_SHARE = 0.05;
const LEVELS_APART_M = 1.5;
const CM = 100;
const TENTHS = 10;
const TURN = 360;

const toCm = (metres: number) => Math.round(metres * CM) / CM;
const toTenth = (degrees: number) => Math.round(degrees * TENTHS) / TENTHS;

/** The runs of bins that hold heights, each as the heights it holds, an empty run apart. */
function heightGroupsOf(sorted: readonly number[]): number[][] {
  const low = sorted[0] ?? 0;
  const counts = new Map<number, number>();
  for (const height of sorted) {
    const bin = Math.floor((height - low) / LEVEL_BIN_M);
    counts.set(bin, (counts.get(bin) ?? 0) + 1);
  }
  const fullest = Math.max(...counts.values());
  const held = (height: number) =>
    (counts.get(Math.floor((height - low) / LEVEL_BIN_M)) ?? 0) >= fullest * LEVEL_EMPTY_SHARE;
  const groups: number[][] = [];
  let last: number | null = null;
  for (const height of sorted.filter(held)) {
    if (last === null || height - last >= LEVELS_APART_M) groups.push([]);
    groups[groups.length - 1]?.push(height);
    last = height;
  }
  return groups;
}

/**
 * The heights of an outline's main part — its fullest group — as the range they run between, when
 * its heights fall in two groups or more with an empty run between: a tower and its annex, a roof
 * and the trees over it. `null` for one roof, its heights running on.
 */
export function mainGroupOf(heights: readonly number[]): { low: number; high: number } | null {
  const sorted = [...heights].sort((a, b) => a - b);
  const groups = heightGroupsOf(sorted);
  if (groups.length < 2) return null;
  const main = groups.reduce((most, group) => (group.length > most.length ? group : most));
  return { low: main[0] as number, high: main[main.length - 1] as number };
}

/** A flat roof's fit: the middle of its deck cells, the bumps on the plane left out. */
function flatFit(
  cells: readonly GridCell[],
  plane: PlaneFit,
  groundM: number,
  clear: boolean,
): RoofFit {
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

/** A sloped roof's fit: its slope and facing, its height the plane at its lowest corner. */
function slopedFit(
  corners: readonly GroundPoint[],
  plane: PlaneFit,
  groundM: number,
  clear: boolean,
): RoofFit {
  const eave = Math.min(...corners.map((corner) => planeHeightAt(plane, corner)));
  const facing = planeFacingDeg(plane);
  return {
    kind: 'roof',
    heightM: toCm(Math.max(0, eave - groundM)),
    slopeDeg: toTenth(planeSlopeDeg(plane)),
    facingDeg: facing === null ? null : Math.round(facing) % TURN,
    rmseM: toCm(plane.rmseM),
    clear,
  };
}

/**
 * The roof as the height map sees it, `groundM` its building's ground on the grid's datum; `null`
 * where the map holds too few cells inside it. A flat deck is the middle of its cells inside the
 * edge band with the bumps on it left out; a sloped roof's height is its eave, the plane at its
 * lowest corner. A plane the map does not read clearly over parts at different heights — a tower
 * and its annex, a roof and the trees over it — is read on its main part alone: sloped only where
 * that part is a clean slope, else flat at its deck. Unclear, it is still the best value there is,
 * and says so.
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
  const whole = planeFitTwice(cells);
  if (whole === null) return null;
  const clear = whole.rmseM < FIT_CLEAR_RMSE_M;
  const main = clear ? null : mainGroupOf(cells.map((cell) => cell.height));
  const part =
    main === null ? [] : cells.filter((c) => c.height >= main.low && c.height <= main.high);
  const partPlane = part.length >= PLANE_CELLS_MIN ? planeFitTwice(part) : null;
  if (partPlane !== null) {
    const cleanSlope =
      partPlane.rmseM < FIT_CLEAR_RMSE_M && planeSlopeDeg(partPlane) >= FLAT_SLOPE_MAX_DEG;
    return cleanSlope
      ? slopedFit(corners, partPlane, groundM, clear)
      : flatFit(
          part,
          { ...partPlane, eastRise: 0, northRise: 0, height: median(part.map((c) => c.height)) },
          groundM,
          clear,
        );
  }
  return planeSlopeDeg(whole) < FLAT_SLOPE_MAX_DEG
    ? flatFit(cells, whole, groundM, clear)
    : slopedFit(corners, whole, groundM, clear);
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
