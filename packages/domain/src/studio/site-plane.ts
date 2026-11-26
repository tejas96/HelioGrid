import type { GroundPoint } from './ground';
import type { GridCell } from './site-grid';

/**
 * A plane fitted to a roof's heights by least squares (`T-M05-002`, part g): height = `height` at
 * the cells' middle, rising `eastRise` metres for each metre east and `northRise` for each metre
 * north. `rmseM`, how far the cells lie off it, says how far it can be trusted.
 */
export interface PlaneFit {
  readonly east: number;
  readonly north: number;
  readonly height: number;
  readonly eastRise: number;
  readonly northRise: number;
  readonly rmseM: number;
  readonly count: number;
}

/** Fewer cells than this fit no plane worth reading: three metres square at a 0.5 m grid. */
export const PLANE_CELLS_MIN = 12;
/** A cell this far off the first plane is a tank, a stair room or a tree, and is left out. */
const OUTLIER_M = 1;
/** A slope under this is flat: no facing is read. */
const FACING_SLOPE_MIN_DEG = 3;
const DEGREES = 180 / Math.PI;
const TURN = 360;

/** The plane's height at a point. */
export function planeHeightAt(plane: PlaneFit, point: GroundPoint): number {
  return (
    plane.height +
    plane.eastRise * (point.east - plane.east) +
    plane.northRise * (point.north - plane.north)
  );
}

/** The plane's slope in degrees. */
export function planeSlopeDeg(plane: PlaneFit): number {
  return Math.atan(Math.hypot(plane.eastRise, plane.northRise)) * DEGREES;
}

/**
 * The compass bearing the plane slopes DOWN toward (0 north, 90 east); `null` where it is flat, so
 * a facing is never read off a flat deck's noise.
 */
export function planeFacingDeg(plane: PlaneFit): number | null {
  if (planeSlopeDeg(plane) < FACING_SLOPE_MIN_DEG) return null;
  const bearing = Math.atan2(-plane.eastRise, -plane.northRise) * DEGREES;
  return (bearing + TURN) % TURN;
}

/** The least-squares plane through the cells; `null` for too few, or cells all in one line. */
export function planeFit(cells: readonly GridCell[]): PlaneFit | null {
  const count = cells.length;
  if (count < PLANE_CELLS_MIN) return null;
  let east = 0;
  let north = 0;
  let height = 0;
  for (const cell of cells) {
    east += cell.east;
    north += cell.north;
    height += cell.height;
  }
  east /= count;
  north /= count;
  height /= count;
  let ee = 0;
  let en = 0;
  let nn = 0;
  let eh = 0;
  let nh = 0;
  for (const cell of cells) {
    const de = cell.east - east;
    const dn = cell.north - north;
    const dh = cell.height - height;
    ee += de * de;
    en += de * dn;
    nn += dn * dn;
    eh += de * dh;
    nh += dn * dh;
  }
  const determinant = ee * nn - en * en;
  if (Math.abs(determinant) < 1e-9) return null;
  const eastRise = (eh * nn - nh * en) / determinant;
  const northRise = (nh * ee - eh * en) / determinant;
  let squares = 0;
  for (const cell of cells) {
    const off =
      cell.height - height - eastRise * (cell.east - east) - northRise * (cell.north - north);
    squares += off * off;
  }
  return { east, north, height, eastRise, northRise, rmseM: Math.sqrt(squares / count), count };
}

/**
 * The plane in two passes: fitted, then fitted again without the cells more than a metre off it
 * (a tank, a stair room, a tree's crown over the edge). The first plane stands where too few are
 * left for the second.
 */
export function planeFitTwice(cells: readonly GridCell[]): PlaneFit | null {
  const first = planeFit(cells);
  if (first === null) return null;
  const kept = cells.filter(
    (cell) => Math.abs(cell.height - planeHeightAt(first, cell)) <= OUTLIER_M,
  );
  return planeFit(kept) ?? first;
}
