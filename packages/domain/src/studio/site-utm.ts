import type { Coordinate } from '../format/areas';

/**
 * UTM, the grid Google's height maps are laid on (`T-M05-002`, part g): a place on the globe to
 * metres east and north in its zone, by the Snyder series for the WGS 84 ellipsoid (within a
 * millimetre inside a zone). The height map is read onto the site's own ground through it, so the
 * zone's turn off true north — up to 3° at a zone's edge — never moves a roof.
 */

export interface UtmZone {
  readonly zone: number;
  readonly north: boolean;
}

export interface UtmPoint {
  readonly easting: number;
  readonly northing: number;
}

const A = 6_378_137;
const FLATTENING = 1 / 298.257_223_563;
const K0 = 0.9996;
const E2 = FLATTENING * (2 - FLATTENING);
const EP2 = E2 / (1 - E2);
const FALSE_EASTING = 500_000;
const FALSE_NORTHING_SOUTH = 10_000_000;
const RADIANS = Math.PI / 180;
const EPSG_NORTH = 32_600;
const EPSG_SOUTH = 32_700;
const ZONES = 60;
const ZONE_DEGREES = 6;

/** The zone an EPSG code names (326xx north, 327xx south); `null` for any other grid. */
export function utmZoneOfEpsg(epsg: number): UtmZone | null {
  if (epsg > EPSG_NORTH && epsg <= EPSG_NORTH + ZONES)
    return { zone: epsg - EPSG_NORTH, north: true };
  if (epsg > EPSG_SOUTH && epsg <= EPSG_SOUTH + ZONES)
    return { zone: epsg - EPSG_SOUTH, north: false };
  return null;
}

/** A place on the globe in a UTM zone's metres. */
export function utmOf(place: Coordinate, zone: UtmZone): UtmPoint {
  const phi = place.latitude * RADIANS;
  const lambda0 = ((zone.zone - 1) * ZONE_DEGREES - 180 + ZONE_DEGREES / 2) * RADIANS;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const tan = Math.tan(phi);
  const n = A / Math.sqrt(1 - E2 * sin * sin);
  const t = tan * tan;
  const c = EP2 * cos * cos;
  const a = (place.longitude * RADIANS - lambda0) * cos;
  const m =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * phi -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi));
  const easting =
    K0 *
      n *
      (a + ((1 - t + c) * a ** 3) / 6 + ((5 - 18 * t + t * t + 72 * c - 58 * EP2) * a ** 5) / 120) +
    FALSE_EASTING;
  const northing =
    K0 *
      (m +
        n *
          tan *
          ((a * a) / 2 +
            ((5 - t + 9 * c + 4 * c * c) * a ** 4) / 24 +
            ((61 - 58 * t + t * t + 600 * c - 330 * EP2) * a ** 6) / 720)) +
    (zone.north ? 0 : FALSE_NORTHING_SOUTH);
  return { easting, northing };
}
