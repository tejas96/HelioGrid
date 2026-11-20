import type { Coordinate } from '../format/areas';

/**
 * The site's ground: metres east and north of the pin. A roof, a picture and every part of a design
 * are stored in it, so a picture fetched again lands where the last one lay and the roof keeps its
 * place. Flat over a site: across 500 m the earth's curve moves a point by under a millimetre.
 */
export interface GroundPoint {
  readonly east: number;
  readonly north: number;
}

/** WGS 84's equator radius, the one Web Mercator tiles are cut by. */
const EARTH_RADIUS_M = 6_378_137;
const RADIANS = Math.PI / 180;

/** Where a point on the globe lies on the ground of a site pinned at `origin`. */
export function groundOf(origin: Coordinate, point: Coordinate): GroundPoint {
  return {
    east:
      (point.longitude - origin.longitude) *
      RADIANS *
      EARTH_RADIUS_M *
      Math.cos(origin.latitude * RADIANS),
    north: (point.latitude - origin.latitude) * RADIANS * EARTH_RADIUS_M,
  };
}

/** The point on the globe a spot of the ground of a site pinned at `origin` stands on. */
export function coordinateOf(origin: Coordinate, ground: GroundPoint): Coordinate {
  return {
    latitude: origin.latitude + ground.north / EARTH_RADIUS_M / RADIANS,
    longitude:
      origin.longitude +
      ground.east / (EARTH_RADIUS_M * Math.cos(origin.latitude * RADIANS)) / RADIANS,
  };
}
