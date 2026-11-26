import type { Coordinate } from '@heliogrid/domain';
import { coordinateOf } from '@heliogrid/domain';
import { atLatitude, unansweredLatitude } from './roof-data.memory';
import type {
  BuildingOutlineSource,
  FarHorizonPoint,
  FarHorizonSource,
  MappedBuilding,
} from './site-surrounds';
import { uncoveredLatitude } from './sky-picture-source.memory';

/** A longitude no test site uses: a pin here is a place whose free sources do not answer. */
export const surroundsUnansweredLongitude = 1.5;

/** PVGIS's 7.5° steps round the compass, counted from the south; east is −90. */
const BEARINGS = 48;
const BEARING_STEP_DEG = 7.5;
const HALF_TURN = 180;
const EAST_FROM_SOUTH = -90;
const RIDGE_DEG = 12;
const PLAINS_DEG = 1;

/**
 * The test suites' far hills: a ridge 12° high to the east, the plains elsewhere; nothing over the
 * sea at `uncoveredLatitude`.
 */
export class MemoryFarHorizon implements FarHorizonSource {
  async horizonAt(point: Coordinate): Promise<readonly FarHorizonPoint[] | null> {
    if (point.longitude === surroundsUnansweredLongitude) throw new Error('no answer');
    if (atLatitude(point, uncoveredLatitude)) return null;
    return Array.from({ length: BEARINGS }, (_, i) => {
      const bearingFromSouthDeg = -HALF_TURN + i * BEARING_STEP_DEG;
      return {
        bearingFromSouthDeg,
        elevationDeg: bearingFromSouthDeg === EAST_FROM_SOUTH ? RIDGE_DEG : PLAINS_DEG,
      };
    });
  }
}

/**
 * The test suites' OpenStreetMap: one house round every pin, 12 × 10 m and two floors above its
 * ground floor — but not where the height service holds a map, which the studio never asks it of.
 */
export class MemoryBuildingOutlines implements BuildingOutlineSource {
  readonly setUp = true;
  asked = 0;

  async outlinesNear(point: Coordinate): Promise<readonly MappedBuilding[]> {
    this.asked += 1;
    if (point.longitude === surroundsUnansweredLongitude) throw new Error('no answer');
    if (atLatitude(point, unansweredLatitude)) return [];
    const ring = [
      { east: -6, north: -5 },
      { east: 6, north: -5 },
      { east: 6, north: 5 },
      { east: -6, north: 5 },
    ].map((corner) => coordinateOf(point, corner));
    return [{ ring, heightM: null, floorsAbove: 2 }];
  }
}
