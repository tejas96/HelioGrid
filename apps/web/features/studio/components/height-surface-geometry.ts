import type { GroundSpan } from '@heliogrid/data/react';
import {
  HEIGHT_VIEW_FADE_M,
  HEIGHT_VIEW_NEAR_M,
  type HeightGrid,
  type SiteLineUp,
} from '@heliogrid/domain';
import { BufferAttribute, BufferGeometry, Color } from 'three';

/**
 * The height view's one mesh (`T-M05-002`, part g): two triangles a cell, each corner coloured by
 * the key and as strong as its distance from the roofs and its steepness allow.
 */

/** The surface is drawn a cell a side of this, whatever the grid's own: a house is 10k cells. */
const CELL_M = 0.5;
/**
 * A cell's slope along a side (its rise over its side) fades it from this to full wall: a wall in
 * the map shows faint, so the tops read, and a cell half up a wall fades half, never a curtain hung
 * off a roof's edge. A 45° roof (1) shows in full, on the sharp grid and the metre grid alike.
 */
const SLOPE_FULL = 1;
const SLOPE_WALL = 2.4;
const WALL_FADE = 0.1;

/** How strong a cell shows for its slope: in full on a top, faint on a wall. */
function wallStrength(slope: number): number {
  const steep = Math.min(1, Math.max(0, (slope - SLOPE_FULL) / (SLOPE_WALL - SLOPE_FULL)));
  return 1 - (1 - WALL_FADE) * steep;
}
/** The map fades to nothing over this, in from its own edge: it never ends in a hard line. */
const EDGE_FADE_M = 6;
/** A sharp grid and the metre grid round it cross over this, in from the sharp one's edge. */
const BLEND_M = 1.5;
/** Flat in the top view: just over the picture, under every roof. */
const FLAT_LIFT_M = 0.04;
const XYZ = 3;
const RGBA = 4;
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

export interface SurfaceLook {
  readonly flat: boolean;
  /** Fades to nothing at the grid's own edge; else it meets the grid round it there. */
  readonly fadeEdge: boolean;
  /** The ground the grid covers. */
  readonly span: GroundSpan;
  /** Ground another grid draws: its cells are left out. */
  readonly skip: GroundSpan | null;
  readonly colours: readonly string[];
  readonly lowM: number;
  readonly highM: number;
  readonly near: readonly { readonly east: number; readonly north: number }[];
  readonly lineUp: SiteLineUp;
}

function rampAt(stops: readonly Color[], t: number, into: Color): Color {
  const at = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const below = Math.floor(at);
  const above = Math.min(stops.length - 1, below + 1);
  return into.copy(stops[below] as Color).lerp(stops[above] as Color, at - below);
}

function nearFade(east: number, north: number, near: SurfaceLook['near']): number {
  // No roof drawn yet: the whole map shows, so the buildings' real edges guide the first corners.
  if (near.length === 0) return 1;
  let away = Number.POSITIVE_INFINITY;
  for (const p of near) away = Math.min(away, Math.hypot(p.east - east, p.north - north));
  return Math.min(1, Math.max(0, 1 - (away - HEIGHT_VIEW_NEAR_M) / HEIGHT_VIEW_FADE_M));
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** How far a point lies inside a span, in metres; below 0 outside it. */
function insideOf(east: number, north: number, span: GroundSpan): number {
  return Math.min(east - span.west, span.east - east, north - span.south, span.north - north);
}

/**
 * How strong a point is for where it lies: fading in from the grid's own edge — over the edge's
 * fade, or over the blend where the grid round it meets it — and fading out where it lies under
 * the grid this one leaves the ground to, so the two cross over with no seam.
 */
function placeFade(east: number, north: number, look: SurfaceLook): number {
  const over = look.fadeEdge ? EDGE_FADE_M : BLEND_M;
  const own = clamp01(insideOf(east, north, look.span) / over);
  const under = look.skip === null ? 1 : 1 - clamp01(insideOf(east, north, look.skip) / BLEND_M);
  return own * under;
}

/** A cell the grid it leaves the ground to covers in full, past the blend. */
function skipped(east: number, north: number, skip: GroundSpan | null, step: number): boolean {
  return skip !== null && insideOf(east, north, skip) > BLEND_M + step;
}

export function heightSurfaceGeometry(grid: HeightGrid, look: SurfaceLook): BufferGeometry {
  const stops = look.colours.map((c) => new Color(c));
  const every = Math.max(1, Math.round(CELL_M / grid.stepM));
  const cols = Math.floor(grid.cols / every);
  const rows = Math.floor(grid.rows / every);
  const step = grid.stepM * every;
  const heightAt = (c: number, r: number) =>
    grid.heights[r * every * grid.cols + c * every] ?? Number.NaN;
  const positions = new Float32Array(cols * rows * QUAD.length * XYZ);
  const tints = new Float32Array(cols * rows * QUAD.length * RGBA);
  const tint = new Color();
  let at = 0;
  const corner = (c: number, r: number, h: number, wall: number) => {
    const onGrid = {
      east: grid.west + (c + MIDDLE) * step,
      north: grid.south + (r + MIDDLE) * step,
    };
    const east = onGrid.east + look.lineUp.east;
    const north = onGrid.north + look.lineUp.north;
    const lifted = h + look.lineUp.lift;
    positions.set([east, look.flat ? FLAT_LIFT_M : lifted, -north], at * XYZ);
    rampAt(stops, (lifted - look.lowM) / Math.max(1, look.highM - look.lowM), tint);
    // Flat, the map hides nothing: it shows in full, fading only at its own edge.
    const near = look.flat ? 1 : nearFade(east, north, look.near);
    const strength = near * placeFade(onGrid.east, onGrid.north, look);
    tints.set([tint.r, tint.g, tint.b, strength * wall], at * RGBA);
    at += 1;
  };
  for (let r = 0; r < rows - 1; r += 1) {
    for (let c = 0; c < cols - 1; c += 1) {
      if (skipped(grid.west + (c + 1) * step, grid.south + (r + 1) * step, look.skip, step))
        continue;
      const hs = QUAD.map(([dc, dr]) => heightAt(c + dc, r + dr));
      if (hs.some(Number.isNaN)) continue;
      // Flat too: a wall's cell blends the roof's colour into the ground's, a soft halo round
      // every building; faded, each top keeps its own edge (board G7t).
      // Along the cell's sides, never its diagonal, which a pitched roof climbs farther.
      const [h00, h10, h11, , , h01] = hs as [number, number, number, number, number, number];
      const rise = Math.max(
        Math.abs(h10 - h00),
        Math.abs(h11 - h10),
        Math.abs(h01 - h11),
        Math.abs(h00 - h01),
      );
      const wall = wallStrength(rise / step);
      QUAD.forEach(([dc, dr], k) => {
        corner(c + dc, r + dr, hs[k] as number, wall);
      });
    }
  }
  const made = new BufferGeometry();
  made.setAttribute('position', new BufferAttribute(positions.subarray(0, at * XYZ), XYZ));
  made.setAttribute('color', new BufferAttribute(tints.subarray(0, at * RGBA), RGBA));
  return made;
}
