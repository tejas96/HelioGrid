import type { GroundBox } from './ground';
import type { HeightGrid } from './site-data';

/**
 * LiDAR's scan as one lit surface (`T-M05-002g`, step 5): each of the site data's grids as an
 * indexed mesh of its cells — the sharp grid round the roofs at its own 0.25 m, the metre grid
 * round it out to the data's edge — with the normals the light needs. Worked in the studio's Web
 * Worker; within a budget of triangles a phone draws smoothly, a grid too fine for it is thinned.
 * Scene space: x east, y up, z south; heights as the grids hold them, above the site's datum.
 */

/** The most triangles the scan may have: the studio's budget for the whole frame. */
export const SCAN_TRIANGLES_MAX = 300_000;
/** The metre grid sits this far under the sharp one, so the two never fight where they meet. */
const SURROUND_DROP_M = 0.04;

export interface ScanLayer {
  readonly grid: HeightGrid;
  /** Ground this layer leaves to a sharper one; `null` when it draws all of its grid. */
  readonly skip: GroundBox | null;
}

export interface ScanMesh {
  /** x, y, z per vertex. */
  readonly positions: Float32Array;
  /** x, y, z per vertex, unit length. */
  readonly normals: Float32Array;
  readonly indices: Uint32Array;
}

const triangles = (cols: number, rows: number, every: number) =>
  Math.max(0, Math.ceil(cols / every) - 1) * Math.max(0, Math.ceil(rows / every) - 1) * 2;

/** How many cells each mesh cell takes, the same for every layer: 1, then 2, 3… while over budget. */
export function scanThinning(layers: readonly ScanLayer[], max = SCAN_TRIANGLES_MAX): number {
  for (let every = 1; ; every += 1) {
    const total = layers.reduce(
      (sum, layer) => sum + triangles(layer.grid.cols, layer.grid.rows, every),
      0,
    );
    if (total <= max || every >= Math.max(...layers.map((l) => Math.max(l.grid.cols, l.grid.rows))))
      return every;
  }
}

/**
 * A cell the sharper layer draws: inside its box by a cell or more. The cells along the box's edge
 * stay, a few centimetres under the sharp ones, so no gap opens between the two.
 */
const drawnAbove = (box: GroundBox | null, east: number, north: number, cellM: number) =>
  box !== null &&
  east > box.west + cellM &&
  east < box.east - cellM &&
  north > box.south + cellM &&
  north < box.north - cellM;

/** One layer's vertices and triangles, appended to the mesh's lists. */
function addLayer(
  layer: ScanLayer,
  every: number,
  drop: number,
  out: { positions: number[]; indices: number[] },
) {
  const { grid, skip } = layer;
  const cols = Math.ceil(grid.cols / every);
  const rows = Math.ceil(grid.rows / every);
  const first = out.positions.length / 3;
  const at = (col: number, row: number) => first + row * cols + col;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const c = Math.min(grid.cols - 1, col * every);
      const r = Math.min(grid.rows - 1, row * every);
      const east = grid.west + (c + 0.5) * grid.stepM;
      const north = grid.south + (r + 0.5) * grid.stepM;
      out.positions.push(east, (grid.heights[r * grid.cols + c] as number) - drop, -north);
    }
  }
  const known = (index: number) => !Number.isNaN(out.positions[index * 3 + 1] as number);
  for (let row = 0; row < rows - 1; row += 1) {
    for (let col = 0; col < cols - 1; col += 1) {
      const a = at(col, row);
      const b = at(col + 1, row);
      const c = at(col, row + 1);
      const d = at(col + 1, row + 1);
      if (![a, b, c, d].every(known)) continue;
      const middleEast = ((out.positions[a * 3] as number) + (out.positions[d * 3] as number)) / 2;
      const middleNorth =
        -((out.positions[a * 3 + 2] as number) + (out.positions[d * 3 + 2] as number)) / 2;
      if (drawnAbove(skip, middleEast, middleNorth, grid.stepM * every)) continue;
      // Wound so the top faces up: x east, z south.
      out.indices.push(a, b, c, b, d, c);
    }
  }
}

/** Each vertex's normal: the sum of its triangles' faces, made unit length. */
function normalsOf(positions: Float32Array, indices: Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i] as number, indices[i + 1] as number, indices[i + 2] as number];
    const ux = (positions[b * 3] as number) - (positions[a * 3] as number);
    const uy = (positions[b * 3 + 1] as number) - (positions[a * 3 + 1] as number);
    const uz = (positions[b * 3 + 2] as number) - (positions[a * 3 + 2] as number);
    const vx = (positions[c * 3] as number) - (positions[a * 3] as number);
    const vy = (positions[c * 3 + 1] as number) - (positions[a * 3 + 1] as number);
    const vz = (positions[c * 3 + 2] as number) - (positions[a * 3 + 2] as number);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) {
      normals[v * 3] = (normals[v * 3] as number) + nx;
      normals[v * 3 + 1] = (normals[v * 3 + 1] as number) + ny;
      normals[v * 3 + 2] = (normals[v * 3 + 2] as number) + nz;
    }
  }
  for (let v = 0; v < normals.length; v += 3) {
    const length = Math.hypot(
      normals[v] as number,
      normals[v + 1] as number,
      normals[v + 2] as number,
    );
    if (length === 0) {
      normals[v + 1] = 1;
      continue;
    }
    normals[v] = (normals[v] as number) / length;
    normals[v + 1] = (normals[v + 1] as number) / length;
    normals[v + 2] = (normals[v + 2] as number) / length;
  }
  return normals;
}

/**
 * The scan's mesh from the site's layers, the sharp ones first; the metre grids sit a few
 * centimetres lower. A cell with no height leaves a hole. Vertices with no height stay in the
 * list, at 0, unused.
 */
export function scanMeshOf(layers: readonly ScanLayer[], max = SCAN_TRIANGLES_MAX): ScanMesh {
  const every = layers.length === 0 ? 1 : scanThinning(layers, max);
  const out = { positions: [] as number[], indices: [] as number[] };
  for (const layer of layers)
    addLayer(layer, every, layer.skip === null ? 0 : SURROUND_DROP_M, out);
  const positions = Float32Array.from(out.positions, (value) => (Number.isNaN(value) ? 0 : value));
  const indices = Uint32Array.from(out.indices);
  return { positions, normals: normalsOf(positions, indices), indices };
}
