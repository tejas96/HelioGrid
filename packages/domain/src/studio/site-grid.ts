import { base64Of, bytesOfBase64 } from '../format/base64';
import type { GroundBox, GroundPoint } from './ground';
import { pointInside } from './roof-shape';
import type { HeightGrid, HeightGridWire } from './site-data';

export type { HeightGrid } from './site-data';

/** Which cells of a grid lie on a building: the height map's own building mask, 1 or 0. */
export interface MaskGrid {
  readonly west: number;
  readonly south: number;
  readonly stepM: number;
  readonly cols: number;
  readonly rows: number;
  readonly cells: Uint8Array;
}

/** One cell's middle and its height. */
export interface GridCell {
  readonly east: number;
  readonly north: number;
  readonly height: number;
}

/** The two-byte value a cell with no data travels as. */
const NO_DATA_CM = -32_768;
const CM_MAX = 32_767;
const CM_PER_M = 100;

/** The middle of cell `col, row`. */
export function cellMiddle(
  grid: Pick<HeightGrid, 'west' | 'south' | 'stepM'>,
  col: number,
  row: number,
): GroundPoint {
  return {
    east: grid.west + (col + 0.5) * grid.stepM,
    north: grid.south + (row + 0.5) * grid.stepM,
  };
}

/** The height of the cell a point lies in; `NaN` off the grid or where the data holds none. */
export function heightAt(grid: HeightGrid, point: GroundPoint): number {
  const col = Math.floor((point.east - grid.west) / grid.stepM);
  const row = Math.floor((point.north - grid.south) / grid.stepM);
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return Number.NaN;
  return grid.heights[row * grid.cols + col] as number;
}

/** Whether the cell a point lies in is a building's; off the grid it is not. */
export function onBuilding(mask: MaskGrid, point: GroundPoint): boolean {
  const col = Math.floor((point.east - mask.west) / mask.stepM);
  const row = Math.floor((point.north - mask.south) / mask.stepM);
  if (col < 0 || row < 0 || col >= mask.cols || row >= mask.rows) return false;
  return mask.cells[row * mask.cols + col] === 1;
}

/** How far a point lies from a ring's nearest edge. */
export function distanceToRing(point: GroundPoint, ring: readonly GroundPoint[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i] as GroundPoint;
    const b = ring[(i + 1) % ring.length] as GroundPoint;
    const east = b.east - a.east;
    const north = b.north - a.north;
    const reach = east * east + north * north;
    const t =
      reach === 0
        ? 0
        : Math.min(
            1,
            Math.max(0, ((point.east - a.east) * east + (point.north - a.north) * north) / reach),
          );
    best = Math.min(
      best,
      Math.hypot(point.east - (a.east + east * t), point.north - (a.north + north * t)),
    );
  }
  return best;
}

/** The box round a ring, `marginM` wider each way. */
export function ringBox(ring: readonly GroundPoint[], marginM = 0): GroundBox {
  const easts = ring.map((p) => p.east);
  const norths = ring.map((p) => p.north);
  return {
    west: Math.min(...easts) - marginM,
    east: Math.max(...easts) + marginM,
    south: Math.min(...norths) - marginM,
    north: Math.max(...norths) + marginM,
  };
}

/** The cells with data whose middles lie in a box. */
export function cellsInBox(grid: HeightGrid, box: GroundBox): GridCell[] {
  const fromCol = Math.max(0, Math.floor((box.west - grid.west) / grid.stepM));
  const toCol = Math.min(grid.cols - 1, Math.floor((box.east - grid.west) / grid.stepM));
  const fromRow = Math.max(0, Math.floor((box.south - grid.south) / grid.stepM));
  const toRow = Math.min(grid.rows - 1, Math.floor((box.north - grid.south) / grid.stepM));
  const cells: GridCell[] = [];
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      const height = grid.heights[row * grid.cols + col] as number;
      if (!Number.isNaN(height)) cells.push({ ...cellMiddle(grid, col, row), height });
    }
  }
  return cells;
}

/**
 * The cells whose middles lie inside a ring and at least `insetM` from its edges, with data. Only
 * the ring's box is walked.
 */
export function cellsInside(
  grid: HeightGrid,
  ring: readonly GroundPoint[],
  insetM = 0,
): GridCell[] {
  if (ring.length < 3) return [];
  return cellsInBox(grid, ringBox(ring)).filter(
    (cell) => pointInside(cell, ring) && (insetM <= 0 || distanceToRing(cell, ring) >= insetM),
  );
}

/** The value `share` of the way up a list (0 the lowest, 1 the highest); `NaN` for none. */
export function percentile(values: readonly number[], share: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const at = Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))));
  return sorted[at] as number;
}

/** The middle value of a list; `NaN` for none. */
export function median(values: readonly number[]): number {
  return percentile(values, 0.5);
}

/**
 * The part of a grid inside a box, cut on whole cells: the box's cells and no more, `null` where
 * the box misses the grid.
 */
export function gridCut(
  grid: HeightGrid,
  box: {
    readonly west: number;
    readonly south: number;
    readonly east: number;
    readonly north: number;
  },
): HeightGrid | null {
  const fromCol = Math.max(0, Math.floor((box.west - grid.west) / grid.stepM));
  const fromRow = Math.max(0, Math.floor((box.south - grid.south) / grid.stepM));
  const toCol = Math.min(grid.cols, Math.ceil((box.east - grid.west) / grid.stepM));
  const toRow = Math.min(grid.rows, Math.ceil((box.north - grid.south) / grid.stepM));
  const cols = toCol - fromCol;
  const rows = toRow - fromRow;
  if (cols <= 0 || rows <= 0) return null;
  const heights = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    const from = (fromRow + row) * grid.cols + fromCol;
    heights.set(grid.heights.subarray(from, from + cols), row * cols);
  }
  return {
    west: grid.west + fromCol * grid.stepM,
    south: grid.south + fromRow * grid.stepM,
    stepM: grid.stepM,
    cols,
    rows,
    heights,
  };
}

/**
 * A coarser grid, `factor` cells a side to one: each takes the highest height under it, so a wall
 * or a tree still stands as tall at a glance and still casts its shadow.
 */
export function gridCoarsened(grid: HeightGrid, factor: number): HeightGrid {
  const cols = Math.floor(grid.cols / factor);
  const rows = Math.floor(grid.rows / factor);
  const heights = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      heights[row * cols + col] = highestUnder(grid, col * factor, row * factor, factor);
    }
  }
  return { west: grid.west, south: grid.south, stepM: grid.stepM * factor, cols, rows, heights };
}

/** The highest height in the `size`-square of cells from `col, row`; `NaN` where none has data. */
function highestUnder(grid: HeightGrid, col: number, row: number, size: number): number {
  let top = Number.NaN;
  for (let r = row; r < row + size; r += 1) {
    for (let c = col; c < col + size; c += 1) {
      const height = grid.heights[r * grid.cols + c] as number;
      if (!(height <= top)) top = Number.isNaN(height) ? top : height;
    }
  }
  return top;
}

/** A grid as it travels: each height to the centimetre, clamped to what two bytes hold. */
export function gridToWire(grid: HeightGrid): HeightGridWire {
  const bytes = new Uint8Array(grid.cols * grid.rows * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < grid.cols * grid.rows; i += 1) {
    const height = grid.heights[i] as number;
    const cm = Number.isNaN(height)
      ? NO_DATA_CM
      : Math.max(NO_DATA_CM + 1, Math.min(CM_MAX, Math.round(height * CM_PER_M)));
    view.setInt16(i * 2, cm, true);
  }
  const { west, south, stepM, cols, rows } = grid;
  return { west, south, stepM, cols, rows, centimetres: base64Of(bytes) };
}

/** A grid read back from the wire; `null` when its bytes do not fill its cells. */
export function gridFromWire(wire: HeightGridWire): HeightGrid | null {
  const bytes = bytesOfBase64(wire.centimetres);
  const count = wire.cols * wire.rows;
  if (bytes.length !== count * 2) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const heights = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const cm = view.getInt16(i * 2, true);
    heights[i] = cm === NO_DATA_CM ? Number.NaN : cm / CM_PER_M;
  }
  const { west, south, stepM, cols, rows } = wire;
  return { west, south, stepM, cols, rows, heights };
}
