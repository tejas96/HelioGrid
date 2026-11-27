import { base64Of, bytesOfBase64 } from '../format/base64';
import type { GroundPoint } from './ground';
import type { PictureGridWire } from './site-data';

/**
 * How far the picture lies off the height map (`T-M05-002`, part g): two pictures of the same
 * ground, searched ±3 m in 25 cm steps for the shift that lines their edges up best. The roof
 * stays where it was drawn; only the height map moves under it.
 */

/** A grey picture on the site's ground, row 0 the southmost, as `HeightGrid` lays its cells. */
export interface PictureGrid {
  readonly west: number;
  readonly south: number;
  readonly stepM: number;
  readonly cols: number;
  readonly rows: number;
  readonly values: Float32Array;
}

export interface PictureShift extends GroundPoint {
  /** How well the edges agree at the shift, −1 to 1. */
  readonly score: number;
}

export const SHIFT_REACH_M = 3;
export const SHIFT_STEP_M = 0.25;
/** Edges that agree less than this at their best say nothing: no shift is read. */
const SCORE_MIN = 0.3;
/** A second peak this close to the best, a metre or more from it, makes the best a guess. */
const PEAK_MARGIN = 0.05;
const PEAK_APART_M = 1;

/** The picture's edge strength at each cell: how fast it changes there. */
function edgesOf(picture: PictureGrid): Float32Array {
  const { cols, rows, values } = picture;
  const edges = new Float32Array(cols * rows);
  for (let row = 1; row < rows - 1; row += 1) {
    for (let col = 1; col < cols - 1; col += 1) {
      const at = row * cols + col;
      const dx = (values[at + 1] as number) - (values[at - 1] as number);
      const dy = (values[at + cols] as number) - (values[at - cols] as number);
      edges[at] = Math.hypot(dx, dy);
    }
  }
  return edges;
}

/** A picture's value between its cells' middles; `NaN` off it. */
function valueBetween(picture: PictureGrid, values: Float32Array, point: GroundPoint): number {
  const x = (point.east - picture.west) / picture.stepM - 0.5;
  const y = (point.north - picture.south) / picture.stepM - 0.5;
  const col = Math.floor(x);
  const row = Math.floor(y);
  if (col < 0 || row < 0 || col >= picture.cols - 1 || row >= picture.rows - 1) return Number.NaN;
  const fx = x - col;
  const fy = y - row;
  const at = row * picture.cols + col;
  const a = values[at] as number;
  const b = values[at + 1] as number;
  const c = values[at + picture.cols] as number;
  const d = values[at + picture.cols + 1] as number;
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

/** How alike two edge pictures are with the moving one shifted: their normalised correlation. */
function agreement(
  fixed: PictureGrid,
  fixedEdges: Float32Array,
  moving: PictureGrid,
  movingEdges: Float32Array,
  shift: GroundPoint,
): number {
  let n = 0;
  let sa = 0;
  let sb = 0;
  let saa = 0;
  let sbb = 0;
  let sab = 0;
  for (let row = 1; row < fixed.rows - 1; row += 1) {
    for (let col = 1; col < fixed.cols - 1; col += 1) {
      const a = fixedEdges[row * fixed.cols + col] as number;
      const b = valueBetween(moving, movingEdges, {
        east: fixed.west + (col + 0.5) * fixed.stepM - shift.east,
        north: fixed.south + (row + 0.5) * fixed.stepM - shift.north,
      });
      if (Number.isNaN(b)) continue;
      n += 1;
      sa += a;
      sb += b;
      saa += a * a;
      sbb += b * b;
      sab += a * b;
    }
  }
  if (n === 0) return Number.NaN;
  const cov = sab - (sa * sb) / n;
  const spread = Math.sqrt((saa - (sa * sa) / n) * (sbb - (sb * sb) / n));
  return spread === 0 ? Number.NaN : cov / spread;
}

/**
 * The shift that lays `moving` on `fixed`: a spot of the ground at `p` in `moving` lies at
 * `p + shift` in `fixed`. `null` where the edges never agree well, or agree as well a metre away.
 */
export function pictureShiftOf(fixed: PictureGrid, moving: PictureGrid): PictureShift | null {
  const fixedEdges = edgesOf(fixed);
  const movingEdges = edgesOf(moving);
  const steps = Math.round(SHIFT_REACH_M / SHIFT_STEP_M);
  const tried: PictureShift[] = [];
  for (let i = -steps; i <= steps; i += 1) {
    for (let j = -steps; j <= steps; j += 1) {
      const shift = { east: i * SHIFT_STEP_M, north: j * SHIFT_STEP_M };
      const score = agreement(fixed, fixedEdges, moving, movingEdges, shift);
      if (!Number.isNaN(score)) tried.push({ ...shift, score });
    }
  }
  if (tried.length === 0) return null;
  const best = tried.reduce((a, b) => (b.score > a.score ? b : a));
  if (best.score < SCORE_MIN) return null;
  const rival = tried.some(
    (one) =>
      Math.hypot(one.east - best.east, one.north - best.north) >= PEAK_APART_M &&
      one.score >= best.score - PEAK_MARGIN,
  );
  return rival ? null : best;
}

const GREY_MAX = 255;

export function pictureToWire(picture: PictureGrid): PictureGridWire {
  const bytes = new Uint8Array(picture.values.length);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.max(
      0,
      Math.min(GREY_MAX, Math.round((picture.values[i] as number) * GREY_MAX)),
    );
  }
  const { west, south, stepM, cols, rows } = picture;
  return { west, south, stepM, cols, rows, grey: base64Of(bytes) };
}

/** A grey picture read back from the wire; `null` when its bytes do not fill its cells. */
export function pictureFromWire(wire: PictureGridWire): PictureGrid | null {
  const bytes = bytesOfBase64(wire.grey);
  if (bytes.length !== wire.cols * wire.rows) return null;
  const values = new Float32Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) values[i] = (bytes[i] as number) / GREY_MAX;
  const { west, south, stepM, cols, rows } = wire;
  return { west, south, stepM, cols, rows, values };
}

/** A picture's pixels as the page decodes them, laid on the site's ground (its box, unstretched). */
export interface PicturePixels {
  /** Red, green, blue and alpha, one byte each, row 0 the northmost. */
  readonly rgba: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

/**
 * The picture a person drew on, grey, on the grid of the straight-down picture: each cell reads the
 * pixel under it, where the picture lies stretched about the pin by `scale` (the first true
 * length). A cell the picture does not reach is mid-grey: no edge.
 */
export function greyOnGrid(
  pieces: readonly PicturePixels[],
  grid: Omit<PictureGrid, 'values'>,
  scale: number,
): PictureGrid {
  const values = new Float32Array(grid.cols * grid.rows).fill(MID_GREY);
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const east = (grid.west + (col + 0.5) * grid.stepM) / scale;
      const north = (grid.south + (row + 0.5) * grid.stepM) / scale;
      const piece = pieces.find(
        (one) => east >= one.west && east < one.east && north >= one.south && north < one.north,
      );
      if (piece === undefined) continue;
      const x = Math.floor(((east - piece.west) / (piece.east - piece.west)) * piece.width);
      const y = Math.floor(((piece.north - north) / (piece.north - piece.south)) * piece.height);
      const at = (Math.min(piece.height - 1, y) * piece.width + Math.min(piece.width - 1, x)) * 4;
      const r = piece.rgba[at] as number;
      const g = piece.rgba[at + 1] as number;
      const b = piece.rgba[at + 2] as number;
      values[row * grid.cols + col] = (0.299 * r + 0.587 * g + 0.114 * b) / GREY_MAX;
    }
  }
  return { ...grid, values };
}

const MID_GREY = 0.5;

/**
 * The studio's own line-up (`T-M05-002g`, step 1): the height map moved onto the picture the
 * roofs were drawn on, by the shift that lines the straight-down picture's edges up with it. `null`
 * where the edges never agree well: the map stays where the data laid it.
 */
export function automaticLineUpOf(
  drawnOn: readonly PicturePixels[],
  straightDown: PictureGridWire,
  scale: number,
): { readonly east: number; readonly north: number; readonly lift: number } | null {
  const moving = pictureFromWire(straightDown);
  if (moving === null || drawnOn.length === 0) return null;
  const { values: _values, ...grid } = moving;
  const shift = pictureShiftOf(greyOnGrid(drawnOn, grid, scale), moving);
  return shift === null ? null : { east: shift.east, north: shift.north, lift: 0 };
}
