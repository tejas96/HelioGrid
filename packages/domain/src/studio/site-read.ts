import type { Coordinate } from '../format/areas';
import { coordinateOf, type GroundBox, type GroundPoint } from './ground';
import { pointInside } from './roof-shape';
import type { SiteBuilding, SiteEave } from './site-data';
import { eavesOf } from './site-eaves';
import { gridCoarsened, gridCut, type HeightGrid, type MaskGrid, median } from './site-grid';
import { groundUnder } from './site-ground';
import { buildingOutlinesOf } from './site-outline';
import type { PictureGrid } from './site-shift';
import { type UtmZone, utmOf } from './site-utm';

/**
 * The server's read of a height map (`T-M05-002`, part g): Google's rasters, laid on its UTM grid,
 * read onto the site's own ground — metres east and north of the pin — and turned into the small
 * site data the studio needs: the heights round the roofs, the heights to the data's edge, each
 * building's outline, its ground and its eaves, and a grey picture to line the height map up with
 * the picture the studio shows.
 */

/** One band of a raster on a UTM grid: `values` row by row from the north, as GeoTIFFs lie. */
export interface UtmRaster {
  readonly zone: UtmZone;
  /** The north-west corner of the raster, in the zone's metres. */
  readonly west: number;
  readonly north: number;
  /** Metres a pixel covers east and south. */
  readonly stepEast: number;
  readonly stepSouth: number;
  readonly cols: number;
  readonly rows: number;
  readonly values: ArrayLike<number>;
  /** The value of a pixel with no data. */
  readonly noData: number | null;
}

/** The site data's grids and buildings, before the far horizon, faces and dates join it. */
export interface SiteRead {
  /** The site's datum, in metres above sea level: the ground of the pin's building. */
  readonly datumM: number;
  /** Heights round the roofs, at the data's own sharpness. */
  readonly near: HeightGrid;
  /** Heights to the data's edge, a metre a cell, each the highest under it. */
  readonly around: HeightGrid;
  readonly buildings: readonly SiteBuilding[];
  readonly eaves: readonly SiteEave[];
  /** The straight-down picture round the pin, grey, half a metre a cell. */
  readonly picture: PictureGrid | null;
}

/** The heights round the roofs reach this far past them, and round the pin before any roof. */
const NEAR_MARGIN_M = 10;
const NEAR_AROUND_PIN_M = 25;
/** The grey picture for the line-up covers the pin ± 30 m, half a metre a cell. */
const PICTURE_REACH_M = 30;
const PICTURE_STEP_M = 0.5;
/** The surround is a metre a cell. */
const AROUND_STEP_M = 1;
/** The ground of each building is read on a half-metre grid: as true, a quarter of the work. */
const GROUND_STEP_M = 0.5;
/** A finite difference this long gives the UTM grid's turn and stretch at the pin. */
const JACOBIAN_M = 50;
/** Google's own "no data" in a height map. */
const DSM_NO_DATA = -9999;

/**
 * The site's ground laid on a UTM zone as one straight map: at a site's size the grid's turn and
 * stretch are the same everywhere to a millimetre, so they are measured once at the pin.
 */
function groundToUtm(pin: Coordinate, zone: UtmZone) {
  const origin = utmOf(pin, zone);
  const east = utmOf(coordinateOf(pin, { east: JACOBIAN_M, north: 0 }), zone);
  const north = utmOf(coordinateOf(pin, { east: 0, north: JACOBIAN_M }), zone);
  const ee = (east.easting - origin.easting) / JACOBIAN_M;
  const en = (east.northing - origin.northing) / JACOBIAN_M;
  const ne = (north.easting - origin.easting) / JACOBIAN_M;
  const nn = (north.northing - origin.northing) / JACOBIAN_M;
  return (point: GroundPoint) => ({
    easting: origin.easting + ee * point.east + ne * point.north,
    northing: origin.northing + en * point.east + nn * point.north,
  });
}

/** The raster's pixel, as a fraction, a UTM point falls in; pixel middles at whole numbers. */
function pixelOf(raster: UtmRaster, utm: { easting: number; northing: number }) {
  return {
    x: (utm.easting - raster.west) / raster.stepEast - 0.5,
    y: (raster.north - utm.northing) / raster.stepSouth - 0.5,
  };
}

function pixelValue(raster: UtmRaster, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= raster.cols || y >= raster.rows) return Number.NaN;
  const value = raster.values[y * raster.cols + x] as number;
  if (raster.noData !== null && value === raster.noData) return Number.NaN;
  if (value <= DSM_NO_DATA) return Number.NaN;
  return value;
}

/**
 * A band read onto the site's ground over `box`, `stepM` a cell: between pixels where all four
 * have data (`smooth`), else the nearest pixel.
 */
export function rasterOnGround(
  raster: UtmRaster,
  pin: Coordinate,
  box: GroundBox,
  stepM: number,
  smooth: boolean,
): HeightGrid {
  const toUtm = groundToUtm(pin, raster.zone);
  const cols = Math.max(1, Math.round((box.east - box.west) / stepM));
  const rows = Math.max(1, Math.round((box.north - box.south) / stepM));
  const heights = new Float32Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const { x, y } = pixelOf(
        raster,
        toUtm({ east: box.west + (col + 0.5) * stepM, north: box.south + (row + 0.5) * stepM }),
      );
      const near = pixelValue(raster, Math.round(x), Math.round(y));
      let value = near;
      if (smooth) {
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const a = pixelValue(raster, x0, y0);
        const b = pixelValue(raster, x0 + 1, y0);
        const c = pixelValue(raster, x0, y0 + 1);
        const d = pixelValue(raster, x0 + 1, y0 + 1);
        if (![a, b, c, d].some(Number.isNaN)) {
          const fx = x - x0;
          const fy = y - y0;
          value = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
        }
      }
      heights[row * cols + col] = value;
    }
  }
  return { west: box.west, south: box.south, stepM, cols, rows, heights };
}

/** The ground a raster covers, in metres east and north of the pin. */
export function rasterBox(raster: UtmRaster, pin: Coordinate): GroundBox {
  const corners = [
    [raster.west, raster.north],
    [raster.west + raster.cols * raster.stepEast, raster.north],
    [raster.west, raster.north - raster.rows * raster.stepSouth],
    [raster.west + raster.cols * raster.stepEast, raster.north - raster.rows * raster.stepSouth],
  ] as const;
  // The inverse of the straight map: solve it at the four corners.
  const toUtm = groundToUtm(pin, raster.zone);
  const o = toUtm({ east: 0, north: 0 });
  const e = toUtm({ east: 1, north: 0 });
  const n = toUtm({ east: 0, north: 1 });
  const a = e.easting - o.easting;
  const b = n.easting - o.easting;
  const c = e.northing - o.northing;
  const d = n.northing - o.northing;
  const det = a * d - b * c;
  const points = corners.map(([easting, northing]) => {
    const de = easting - o.easting;
    const dn = northing - o.northing;
    return { east: (d * de - b * dn) / det, north: (-c * de + a * dn) / det };
  });
  // The box inside all four corners, so every cell of it lies on the raster.
  const easts = points.map((p) => p.east).sort((p, q) => p - q);
  const norths = points.map((p) => p.north).sort((p, q) => p - q);
  return {
    west: easts[1] as number,
    east: easts[2] as number,
    south: norths[1] as number,
    north: norths[2] as number,
  };
}

/** The straight-down picture's three bands as one grey, 0 to 1. */
export function greyOf(red: HeightGrid, green: HeightGrid, blue: HeightGrid): PictureGrid {
  const values = new Float32Array(red.cols * red.rows);
  for (let i = 0; i < values.length; i += 1) {
    const r = red.heights[i] as number;
    const g = green.heights[i] as number;
    const b = blue.heights[i] as number;
    values[i] = Number.isNaN(r + g + b) ? 0 : (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  const { west, south, stepM, cols, rows } = red;
  return { west, south, stepM, cols, rows, values };
}

function shifted(grid: HeightGrid, by: number): HeightGrid {
  const heights = new Float32Array(grid.heights.length);
  for (let i = 0; i < heights.length; i += 1) heights[i] = (grid.heights[i] as number) - by;
  return { ...grid, heights };
}

function maskOf(grid: HeightGrid): MaskGrid {
  const cells = new Uint8Array(grid.heights.length);
  for (let i = 0; i < cells.length; i += 1) cells[i] = (grid.heights[i] as number) > 0.5 ? 1 : 0;
  const { west, south, stepM, cols, rows } = grid;
  return { west, south, stepM, cols, rows, cells };
}

/** The box round the roofs (their corners) with a margin, or round the pin before any roof. */
export function nearBoxOf(corners: readonly GroundPoint[]): GroundBox {
  if (corners.length === 0) {
    return {
      west: -NEAR_AROUND_PIN_M,
      east: NEAR_AROUND_PIN_M,
      south: -NEAR_AROUND_PIN_M,
      north: NEAR_AROUND_PIN_M,
    };
  }
  const easts = corners.map((p) => p.east);
  const norths = corners.map((p) => p.north);
  return {
    west: Math.min(...easts) - NEAR_MARGIN_M,
    east: Math.max(...easts) + NEAR_MARGIN_M,
    south: Math.min(...norths) - NEAR_MARGIN_M,
    north: Math.max(...norths) + NEAR_MARGIN_M,
  };
}

/**
 * The height map read onto the site: `dsm` in metres above sea level, `mask` 1 on buildings, and
 * the straight-down picture's three bands where they came. `near` is the box the fine heights
 * cover (`nearBoxOf`). `null` where the height map holds no data round the pin.
 */
export function siteReadOf(input: {
  readonly pin: Coordinate;
  readonly dsm: UtmRaster;
  readonly mask: UtmRaster;
  readonly rgb: readonly [UtmRaster, UtmRaster, UtmRaster] | null;
  readonly near: GroundBox;
}): SiteRead | null {
  const { pin, dsm, mask } = input;
  const box = rasterBox(dsm, pin);
  const full = rasterOnGround(dsm, pin, box, dsm.stepEast, true);
  const coarse = rasterOnGround(dsm, pin, box, GROUND_STEP_M, true);
  const buildingMask = maskOf(rasterOnGround(mask, pin, box, GROUND_STEP_M, false));
  const outlines = buildingOutlinesOf(buildingMask);
  const grounds = outlines.map((outline) => groundUnder(coarse, buildingMask, outline));
  const pinBuilding = outlines.findIndex((outline) => pointInside({ east: 0, north: 0 }, outline));
  const known = grounds.filter((ground): ground is number => ground !== null);
  const datum =
    (pinBuilding >= 0 ? grounds[pinBuilding] : null) ??
    (known.length > 0 ? median(known) : Number.NaN);
  if (Number.isNaN(datum)) return null;
  const level = shifted(full, datum);
  const near = gridCut(level, input.near) ?? gridCut(level, nearBoxOf([]));
  if (near === null) return null;
  const buildings: SiteBuilding[] = outlines.map((outline, i) => ({
    outline,
    groundM: Math.round(((grounds[i] ?? datum) - datum) * 100) / 100,
    heightM: null,
    floorsAbove: null,
  }));
  const eaves = buildings.flatMap((building) => eavesOf(level, building.outline, building.groundM));
  const factor = Math.max(1, Math.round(AROUND_STEP_M / dsm.stepEast));
  let picture: PictureGrid | null = null;
  if (input.rgb !== null) {
    const pictureBox = {
      west: -PICTURE_REACH_M,
      east: PICTURE_REACH_M,
      south: -PICTURE_REACH_M,
      north: PICTURE_REACH_M,
    };
    const [r, g, b] = input.rgb.map((band) =>
      rasterOnGround(band, pin, pictureBox, PICTURE_STEP_M, true),
    ) as [HeightGrid, HeightGrid, HeightGrid];
    picture = greyOf(r, g, b);
  }
  return {
    datumM: Math.round(datum * 100) / 100,
    near,
    around: gridCoarsened(level, factor),
    buildings,
    eaves,
    picture,
  };
}
