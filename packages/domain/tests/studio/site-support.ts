import type { GroundPoint } from '../../src/studio/ground';
import type { HeightGrid, MaskGrid } from '../../src/studio/site-grid';

/**
 * Synthetic height maps for part g's proofs (`T-M05-002`): no Google data is kept in the repo
 * (Solar terms §21.2, 30 days), so each test builds the ground it reads.
 */

/** A grid `size` metres a side round the pin, `stepM` a cell, each height from `heightOf`. */
export function gridOf(
  size: number,
  stepM: number,
  heightOf: (point: GroundPoint) => number,
): HeightGrid {
  const cols = Math.round(size / stepM);
  const rows = cols;
  const west = -size / 2;
  const south = -size / 2;
  const heights = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      heights[row * cols + col] = heightOf({
        east: west + (col + 0.5) * stepM,
        north: south + (row + 0.5) * stepM,
      });
    }
  }
  return { west, south, stepM, cols, rows, heights };
}

/** The mask of a grid: 1 where `on` says a building stands. */
export function maskOf(grid: HeightGrid, on: (point: GroundPoint) => boolean): MaskGrid {
  const cells = new Uint8Array(grid.cols * grid.rows);
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      cells[row * grid.cols + col] = on({
        east: grid.west + (col + 0.5) * grid.stepM,
        north: grid.south + (row + 0.5) * grid.stepM,
      })
        ? 1
        : 0;
    }
  }
  const { west, south, stepM, cols, rows } = grid;
  return { west, south, stepM, cols, rows, cells };
}

/** A box's four corners, anticlockwise from the south-west. */
export const boxOf = (west: number, south: number, east: number, north: number): GroundPoint[] => [
  { east: west, north: south },
  { east, north: south },
  { east, north },
  { east: west, north },
];

/** Whether a point lies in a box. */
export const inBox =
  (west: number, south: number, east: number, north: number) => (p: GroundPoint) =>
    p.east >= west && p.east <= east && p.north >= south && p.north <= north;
