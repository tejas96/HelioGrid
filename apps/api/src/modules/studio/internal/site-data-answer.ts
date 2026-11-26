import type { BuildingAnswer, SiteDataWire } from '@heliogrid/contracts';
import {
  type Coordinate,
  type GroundPoint,
  groundOf,
  type Roof,
  roofMiddle,
  type SiteBuilding,
} from '@heliogrid/domain';
import {
  gridCoarsened,
  gridCut,
  gridFromWire,
  gridToWire,
  type HeightGrid,
  nearBoxOf,
  type RoofGroup,
} from '@heliogrid/domain/studio-kernel';
import type { KeptHeightMap } from './site-data-kept';
import type { MappedBuilding } from './site-surrounds';

/**
 * The site data's heights as the studio reads them (`T-M05-002`, part g): each kept height map,
 * read round its own call's middle and datum, laid on the design's pin and the datum of the pin's
 * call — the sharp heights cut to its roofs, a metre a cell to its edge — with its buildings,
 * eaves and Google's faces; or, where Google has none, OpenStreetMap's buildings.
 */

export type HeightsAnswer = Omit<SiteDataWire, 'farHorizon' | 'timeZone' | 'credits' | 'gaps'>;

/** A height map kept for one group of the design's roofs. */
export interface GroupMap {
  readonly group: number;
  readonly map: KeptHeightMap;
}

/** Two buildings whose middles lie this close, from two calls that overlap, are one. */
const SAME_BUILDING_M = 1;
const CM = 100;
const toCm = (metres: number) => Math.round(metres * CM) / CM;

/** The answer where no source gave a height. */
export const noHeights = (): HeightsAnswer => ({
  source: 'none',
  quality: null,
  dataOn: null,
  areas: [],
  buildings: [],
  eaves: [],
  faces: [],
  straightDown: null,
});

const moved = (point: GroundPoint, by: GroundPoint): GroundPoint => ({
  east: point.east + by.east,
  north: point.north + by.north,
});

/** A kept grid laid on the pin's ground and datum. */
function onPinGround(grid: HeightGrid, by: GroundPoint, lift: number): HeightGrid {
  const heights = new Float32Array(grid.heights.length);
  for (let i = 0; i < heights.length; i += 1) heights[i] = (grid.heights[i] as number) + lift;
  return { ...grid, west: grid.west + by.east, south: grid.south + by.north, heights };
}

/** One group's heights on the pin's ground: its sharp grid round its roofs, its metre grid. */
function areaOf(
  full: HeightGrid,
  corners: readonly GroundPoint[],
): SiteDataWire['areas'][number] | null {
  const near = gridCut(full, nearBoxOf(corners)) ?? gridCut(full, nearBoxOf([]));
  if (near === null) return null;
  const factor = Math.max(1, Math.round(1 / full.stepM));
  return { grid: gridToWire(near), surround: gridToWire(gridCoarsened(full, factor)) };
}

/** The buildings of every call on the pin's ground, a building two calls saw kept once. */
function buildingsOf(maps: readonly GroupMap[], pin: Coordinate, datum: number): SiteBuilding[] {
  const found: SiteBuilding[] = [];
  for (const { map } of maps) {
    // Laid by the middle it was read round, never by where this reader asked from.
    const by = groundOf(pin, map.middle);
    for (const building of map.buildings) {
      const outline = building.outline.map((corner) => moved(corner, by));
      const middle = roofMiddle(outline);
      const seen = found.some((one) => {
        const other = roofMiddle(one.outline);
        return Math.hypot(other.east - middle.east, other.north - middle.north) < SAME_BUILDING_M;
      });
      if (!seen) {
        found.push({ ...building, outline, groundM: toCm(building.groundM + map.datumM - datum) });
      }
    }
  }
  return found;
}

/** Google's faces on the pin's ground, a face two answers gave kept once. */
function facesOf(
  answers: readonly (BuildingAnswer | null)[],
  pin: Coordinate,
  datum: number,
): SiteDataWire['faces'] {
  const faces = new Map<string, SiteDataWire['faces'][number]>();
  for (const face of answers.flatMap((answer) => answer?.faces ?? [])) {
    const middle = groundOf(pin, face.middle);
    faces.set(`${middle.east.toFixed(1)},${middle.north.toFixed(1)}`, {
      middle,
      slopeDeg: face.slopeDeg,
      facingDeg: face.facingDeg,
      areaM2: face.areaM2,
      heightM: toCm(face.heightAboveSeaM - datum),
    });
  }
  return [...faces.values()];
}

/** Google's heights for the design, on the datum of the first call; `null` with no map at all. */
export function heightsAnswerOf(input: {
  readonly pin: Coordinate;
  readonly standing: readonly Roof[];
  readonly groups: readonly RoofGroup[];
  readonly maps: readonly GroupMap[];
  readonly buildings: readonly (BuildingAnswer | null)[];
}): HeightsAnswer | null {
  const { pin, standing, groups, maps } = input;
  const first = maps[0];
  if (first === undefined) return null;
  const datum = first.map.datumM;
  const areas: SiteDataWire['areas'] = [];
  const eaves: SiteDataWire['eaves'] = [];
  for (const { group, map } of maps) {
    const by = groundOf(pin, map.middle);
    const kept = gridFromWire(map.grid);
    if (kept === null) continue;
    const corners = (groups[group]?.members ?? []).flatMap(
      (index) => standing[index]?.corners ?? [],
    );
    const area = areaOf(onPinGround(kept, by, map.datumM - datum), corners);
    if (area !== null) areas.push(area);
    for (const eave of map.eaves) {
      eaves.push({ ...eave, from: moved(eave.from, by), to: moved(eave.to, by) });
    }
  }
  const picture = first.map.straightDown;
  const by = groundOf(pin, first.map.middle);
  return {
    source: 'google_solar',
    quality: first.map.quality,
    dataOn: first.map.dataOn,
    areas,
    buildings: buildingsOf(maps, pin, datum).map((building) => ({
      ...building,
      outline: [...building.outline],
    })),
    eaves,
    faces: facesOf(input.buildings, pin, datum),
    straightDown:
      picture === null
        ? null
        : { ...picture, west: picture.west + by.east, south: picture.south + by.north },
  };
}

/** OpenStreetMap's buildings on the pin's ground, each on the ground the pin stands on. */
export function outlinesAnswerOf(
  pin: Coordinate,
  mapped: readonly MappedBuilding[],
): HeightsAnswer {
  if (mapped.length === 0) return noHeights();
  return {
    ...noHeights(),
    source: 'openstreetmap',
    buildings: mapped.map((building) => ({
      outline: building.ring.map((corner) => groundOf(pin, corner)),
      groundM: 0,
      heightM: building.heightM,
      floorsAbove: building.floorsAbove,
    })),
  };
}
