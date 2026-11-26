import type { Coordinate } from '@heliogrid/domain';

/**
 * The two free sources part g's site data reads beside the height map (`T-M05-002`, part g):
 * the far hills round a site, and the building outlines where Google holds no height map. Each
 * REJECTS when it does not answer in time; neither is ever retried inside a request.
 */

/** One bearing of the far horizon, as PVGIS counts it: 0 south, 90 west, −90 east. */
export interface FarHorizonPoint {
  readonly bearingFromSouthDeg: number;
  readonly elevationDeg: number;
}

export interface FarHorizonSource {
  /** `null` where the place has none to give — PVGIS's "over the sea". */
  horizonAt(point: Coordinate): Promise<readonly FarHorizonPoint[] | null>;
}

/** A building's outline as OpenStreetMap maps it, with the heights it gives. */
export interface MappedBuilding {
  readonly ring: readonly Coordinate[];
  /** Its height above its ground, from `height` less `min_height`. */
  readonly heightM: number | null;
  /** Its floors above the ground floor, from `building:levels` (and `roof:levels`). */
  readonly floorsAbove: number | null;
}

export interface BuildingOutlineSource {
  readonly setUp: boolean;
  outlinesNear(point: Coordinate, radiusM: number): Promise<readonly MappedBuilding[]>;
}

export const FAR_HORIZON_SOURCE = Symbol('FAR_HORIZON_SOURCE');
export const BUILDING_OUTLINE_SOURCE = Symbol('BUILDING_OUTLINE_SOURCE');
