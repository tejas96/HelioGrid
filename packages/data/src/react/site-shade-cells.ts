import {
  type HeightGrid,
  pointInside,
  type RoofSunlight,
  type SiteLineUp,
} from '@heliogrid/domain';
import { distanceToRing } from '@heliogrid/domain/studio-kernel';

/**
 * The site's shade and sunlight as the scene draws them (`T-M05-002`, part g): which of the height
 * map's cells cast the site's shadows, and which pieces of each roof's sunlight lie on the roof.
 * The scene only turns them into its meshes.
 */

export type GroundOutline = readonly { readonly east: number; readonly north: number }[];

/** A drawn roof the model casts for itself: its outline and its top. */
export interface ShadeCut {
  readonly outline: GroundOutline;
  readonly topM: number;
}

/** The caster is built a cell a side of this, whatever the grid's own. */
const CELL_M = 0.5;
/** Ground lower than this casts nothing. */
const GROUND_M = 0.5;
/**
 * The map's cells this near a drawn roof's outline are its own wall, a cell astride it or the
 * map's offset from the picture: left in, they throw jagged shade down the model's own walls.
 */
const CUT_MARGIN_M = 1;
/** A cell by the wall this much over the roof's top is a taller neighbour's wall: it casts. */
const TALLER_M = 0.5;
/** An outline of fewer corners holds no ground. */
const OUTLINE_MIN = 3;
const XYZ = 3;
const MIDDLE = 0.5;
/** A cell's two triangles, by its corners: south-west, south-east, north-east; and back. */
const QUAD = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 0],
  [1, 1],
  [0, 1],
] as const;

/** A drawn roof's box, grown by `marginM` each way. */
function boxOf(outline: GroundOutline, marginM: number) {
  const easts = outline.map((p) => p.east);
  const norths = outline.map((p) => p.north);
  return {
    west: Math.min(...easts) - marginM,
    east: Math.max(...easts) + marginM,
    south: Math.min(...norths) - marginM,
    north: Math.max(...norths) + marginM,
  };
}

/**
 * A drawn roof's cut, its box turning most cells away at once. A cell against its walls is the
 * roof's own unless it stands over the highest the map reads inside the roof — a ridge or a parapet
 * the model draws as well — by more than a taller neighbour would.
 */
function cutOf({ outline, topM }: ShadeCut, mapTopM: number) {
  const box = boxOf(outline, CUT_MARGIN_M);
  const ownTopM = Math.max(topM, mapTopM) + TALLER_M;
  /** Whether a cell is the model's to shade: inside the roof, or against its walls and no taller. */
  return (at: { east: number; north: number }, highM: number) =>
    at.east >= box.west &&
    at.east <= box.east &&
    at.north >= box.south &&
    at.north <= box.north &&
    (pointInside(at, outline) || (highM <= ownTopM && distanceToRing(at, outline) <= CUT_MARGIN_M));
}

/** The map read a cell a side of `CELL_M`, where the person lined it up. */
function coarseOf(grid: HeightGrid, lineUp: SiteLineUp) {
  const every = Math.max(1, Math.round(CELL_M / grid.stepM));
  const step = grid.stepM * every;
  return {
    cols: Math.floor(grid.cols / every),
    rows: Math.floor(grid.rows / every),
    step,
    east0: grid.west + lineUp.east,
    north0: grid.south + lineUp.north,
    heightAt: (c: number, r: number) =>
      grid.heights[r * every * grid.cols + c * every] ?? Number.NaN,
  };
}

/**
 * The map's cells as triangles' corners, x east, y up, z south, standing where the person lined the
 * map up, as the height view does: each cell with data that `keep` keeps, from its corners' heights
 * and its middle where the line-up puts it.
 */
function cellTriangles(
  grid: HeightGrid,
  lineUp: SiteLineUp,
  keep: (heights: readonly number[], placed: { east: number; north: number }) => boolean,
): Float32Array {
  const { cols, rows, step, east0, north0, heightAt } = coarseOf(grid, lineUp);
  const positions = new Float32Array(cols * rows * QUAD.length * XYZ);
  let at = 0;
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      const hs = QUAD.map(([dc, dr]) => heightAt(c + dc, r + dr));
      if (hs.some(Number.isNaN)) continue;
      if (!keep(hs, { east: east0 + (c + 1) * step, north: north0 + (r + 1) * step })) continue;
      QUAD.forEach(([dc, dr], k) => {
        const x = east0 + (c + dc + MIDDLE) * step;
        const z = -(north0 + (r + dr + MIDDLE) * step);
        positions.set([x, (hs[k] as number) + lineUp.lift, z], at * XYZ);
        at += 1;
      });
    }
  }
  return positions.subarray(0, at * XYZ);
}

/**
 * The height map as one shadow caster (*the shadows are the whole site's*). The drawn roofs are
 * left out — the model casts its own — and so is the bare ground.
 */
export function shadeCasterOf(
  grid: HeightGrid,
  cuts: readonly ShadeCut[],
  lineUp: SiteLineUp,
): Float32Array {
  const { cols, rows, step, east0, north0, heightAt } = coarseOf(grid, lineUp);
  /** The highest the map reads inside an outline, where the line-up puts the map's points. */
  const mapTopOf = (outline: GroundOutline) => {
    const box = boxOf(outline, 0);
    const from = (metres: number, origin: number) => Math.floor((metres - origin) / step);
    let top = Number.NEGATIVE_INFINITY;
    for (
      let r = Math.max(0, from(box.south, north0));
      r <= Math.min(rows - 1, from(box.north, north0) + 1);
      r += 1
    ) {
      for (
        let c = Math.max(0, from(box.west, east0));
        c <= Math.min(cols - 1, from(box.east, east0) + 1);
        c += 1
      ) {
        const at = { east: east0 + c * step, north: north0 + r * step };
        const h = heightAt(c, r);
        if (!Number.isNaN(h) && pointInside(at, outline)) top = Math.max(top, h + lineUp.lift);
      }
    }
    return top;
  };
  const cutters = cuts
    .filter((cut) => cut.outline.length >= OUTLINE_MIN)
    .map((cut) => cutOf(cut, mapTopOf(cut.outline)));
  return cellTriangles(grid, lineUp, (hs, placed) => {
    const highM = Math.max(...hs);
    // The roofs are drawn on the picture: the cell is judged where the line-up puts it.
    return highM >= GROUND_M && !cutters.some((cut) => cut(placed, highM + lineUp.lift));
  });
}

/**
 * The height map as the shadows' catcher: every cell of it at the height the map reads, on the
 * caster's own corners. The picture is a view straight down, so a neighbour's top on it catches
 * shade where that top stands — never the shade its own building throws on the ground under it.
 * The scene samples the shadows up there and draws them flat on the picture.
 */
export function shadeCatcherOf(grid: HeightGrid, lineUp: SiteLineUp): Float32Array {
  return cellTriangles(grid, lineUp, () => true);
}

/** A square of sunlight on a roof: its middle, half its side, and the share of sun it keeps. */
export interface SunlightPiece {
  readonly east: number;
  readonly north: number;
  readonly half: number;
  readonly share: number;
}

/** A metre astride the roof's edge is drawn in pieces this many a side, those inside alone. */
const EDGE_SPLIT = 4;
const SQUARE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

/**
 * A roof's sunlight as squares on its top (board G24): a metre wholly on the roof whole, and one
 * astride its edge as the pieces of it that lie on the roof, so nothing hangs past the walls.
 */
export function sunlightPiecesOf(sunlight: RoofSunlight, corners: GroundOutline): SunlightPiece[] {
  const half = sunlight.cellM * MIDDLE;
  const step = sunlight.cellM / EDGE_SPLIT;
  return sunlight.cells.flatMap(({ east, north, share }) => {
    const whole = SQUARE.every(([de, dn]) =>
      pointInside({ east: east + de * half, north: north + dn * half }, corners),
    );
    if (whole) return [{ east, north, half, share }];
    const pieces: SunlightPiece[] = [];
    for (let i = 0; i < EDGE_SPLIT; i += 1) {
      for (let j = 0; j < EDGE_SPLIT; j += 1) {
        const at = {
          east: east - half + (i + MIDDLE) * step,
          north: north - half + (j + MIDDLE) * step,
        };
        if (pointInside(at, corners)) pieces.push({ ...at, half: step * MIDDLE, share });
      }
    }
    return pieces;
  });
}
