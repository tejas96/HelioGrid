import type { Coordinate } from '../format/areas';
import type { Roof } from './document';
import type { GroundPoint } from './ground';
import { pointInside, roofMiddle } from './roof-shape';
import type { HeightGridWire, SiteBuilding, SiteLineUp } from './site-data';
import {
  cellsInBox,
  cellsInside,
  distanceToRing,
  gridFromWire,
  type HeightGrid,
  percentile,
  ringBox,
} from './site-grid';
import type { RoofDataRead } from './site-heights';
import { roofFitOf } from './site-roof-fit';
import type { Skyline } from './site-skyline';
import type { RoofSunlight } from './site-sun-shown';
import { roofSunlightOf, yearSunSamples } from './site-sunlight';

/**
 * What the height map reads inside each drawn roof (`T-M05-002`, part g), worked in the studio's
 * Web Worker: the sharp grid that holds the roof (else the metre one), its building's ground, and
 * the person's line-up — the map moved under the roof and lifted, never the roof.
 */

/** The site data's grids read back, each sharp grid with its metre one. */
export interface SiteGrids {
  readonly areas: readonly { readonly grid: HeightGrid; readonly surround: HeightGrid }[];
  readonly buildings: readonly SiteBuilding[];
}

/** A roof whose middle lies this close to a building's wall stands on that building's ground. */
const NEAR_BUILDING_M = 3;

/** The site data's grids as they came; an area whose bytes do not fill it is left out. */
export function siteGridsOf(
  areas: readonly { readonly grid: HeightGridWire; readonly surround: HeightGridWire }[],
  buildings: readonly SiteBuilding[],
): SiteGrids {
  const read = areas.flatMap((area) => {
    const grid = gridFromWire(area.grid);
    const surround = gridFromWire(area.surround);
    return grid === null || surround === null ? [] : [{ grid, surround }];
  });
  return { areas: read, buildings };
}

const holds = (grid: HeightGrid, p: GroundPoint) =>
  p.east >= grid.west &&
  p.north >= grid.south &&
  p.east < grid.west + grid.cols * grid.stepM &&
  p.north < grid.south + grid.rows * grid.stepM;

/** The sharpest grid that holds a point. */
function gridAt(site: SiteGrids, p: GroundPoint): HeightGrid | null {
  return (
    site.areas.find((area) => holds(area.grid, p))?.grid ??
    site.areas.find((area) => holds(area.surround, p))?.surround ??
    null
  );
}

/** Round a roof with no building near, its ground is read off the map this far out. */
const OPEN_REACH_M = 15;
/** The share up the open cells the ground is read at: low, as trees and cars stand on it. */
const OPEN_SHARE = 0.1;

/**
 * The ground a roof stands on: its building's, else the nearest building's within reach, else
 * the low cells of the map round it — never the site's datum, which may lie metres off on a hill.
 */
function groundAt(
  site: SiteGrids,
  grid: HeightGrid,
  corners: readonly GroundPoint[],
  p: GroundPoint,
): number {
  const on = site.buildings.find((building) => pointInside(p, building.outline));
  if (on !== undefined) return on.groundM;
  let best: SiteBuilding | null = null;
  let far = NEAR_BUILDING_M;
  for (const building of site.buildings) {
    const away = distanceToRing(p, building.outline);
    if (away <= far) {
      far = away;
      best = building;
    }
  }
  if (best !== null) return best.groundM;
  const around = cellsInBox(grid, ringBox(corners, OPEN_REACH_M)).filter(
    (cell) => !pointInside(cell, corners),
  );
  const low = percentile(
    around.map((cell) => cell.height),
    OPEN_SHARE,
  );
  return Number.isNaN(low) ? 0 : low;
}

/**
 * The scan's low and high inside a roof (`T-M05-002g`, board frame 14): the 10th and 90th of its
 * cells above the ground it stands on, for a sloped roof, whose height is a slope; `null` where the
 * map does not reach it.
 */
export function roofScanRangeOf(
  corners: readonly GroundPoint[],
  site: SiteGrids,
  lineUp: SiteLineUp,
): { readonly lowM: number; readonly highM: number } | null {
  const under = corners.map((c) => ({ east: c.east - lineUp.east, north: c.north - lineUp.north }));
  const middle = roofMiddle(under);
  const grid = gridAt(site, middle);
  if (grid === null) return null;
  const ground = groundAt(site, grid, under, middle) - lineUp.lift;
  const heights = cellsInside(grid, under).map((cell) => cell.height - ground);
  if (heights.length < RANGE_CELLS_MIN) return null;
  return {
    lowM: Math.round(percentile(heights, RANGE_LOW) * 10) / 10,
    highM: Math.round(percentile(heights, RANGE_HIGH) * 10) / 10,
  };
}

const RANGE_CELLS_MIN = 8;
const RANGE_LOW = 0.1;
const RANGE_HIGH = 0.9;

/** Each roof's read, by roof id; a roof the map does not reach reads nothing. */
export function roofDataReadsOf(
  roofs: readonly Pick<Roof, 'id' | 'corners'>[],
  site: SiteGrids,
  lineUp?: SiteLineUp,
): Record<string, RoofDataRead> {
  const shift = lineUp ?? { east: 0, north: 0, lift: 0 };
  const reads: Record<string, RoofDataRead> = {};
  for (const roof of roofs) {
    // The map moved by the line-up: a spot of the roof reads the map where it lay before the move.
    const corners = roof.corners.map((c) => ({
      east: c.east - shift.east,
      north: c.north - shift.north,
    }));
    const middle = roofMiddle(corners);
    const grid = gridAt(site, middle);
    if (grid === null) continue;
    const fit = roofFitOf(grid, corners, groundAt(site, grid, corners, middle) - shift.lift);
    if (fit === null) continue;
    reads[roof.id] =
      fit.kind === 'no_building'
        ? fit
        : {
            kind: 'roof',
            heightM: fit.heightM,
            slopeDeg: fit.slopeDeg,
            facingDeg: fit.facingDeg,
            clear: fit.clear,
          };
  }
  return reads;
}

/**
 * Each roof's sunlight (board G24), on the sharpest grid that holds its middle, under the far
 * hills, for the year's sun at the site; a roof no grid holds has none.
 */
export function roofsSunlightOf(
  site: SiteGrids,
  roofs: readonly Pick<Roof, 'id' | 'corners'>[],
  far: Skyline | null,
  place: Coordinate,
  year: number,
): Record<string, RoofSunlight> {
  const samples = yearSunSamples(place, year);
  const sunlight: Record<string, RoofSunlight> = {};
  for (const roof of roofs) {
    const grid = gridAt(site, roofMiddle(roof.corners));
    if (grid !== null) sunlight[roof.id] = roofSunlightOf(grid, roof.corners, samples, far);
  }
  return sunlight;
}
