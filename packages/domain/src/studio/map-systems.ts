/**
 * The place systems a drone map is drawn in (`T-M05-002d`), as far as the studio reads them: UTM
 * zones on WGS 84, WGS 84 itself in degrees, and Web Mercator — what drone tools write. A map in
 * another system has its scale read when its unit is the metre, and its place is not.
 */

export interface LatLon {
  readonly latitude: number;
  readonly longitude: number;
}

/** A point in a map system's own units: metres east and north for a grid, degrees for WGS 84. */
export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export type MapSystem =
  | { readonly kind: 'utm'; readonly zone: number; readonly south: boolean }
  | { readonly kind: 'geographic' }
  | { readonly kind: 'mercator' };

/** The EPSG codes read: WGS 84; Web Mercator under its three names; UTM north 32601–60, south 32701–60. */
const WGS84 = 4326;
const MERCATOR_CODES: readonly number[] = [3857, 3785, 900913];
const UTM_NORTH_FROM = 32601;
const UTM_SOUTH_FROM = 32701;
const UTM_ZONES = 60;

/** The system an EPSG code names; `null` for one the studio does not read. */
export function mapSystemOf(epsg: number | null | undefined): MapSystem | null {
  if (epsg === null || epsg === undefined) return null;
  if (epsg === WGS84) return { kind: 'geographic' };
  if (MERCATOR_CODES.includes(epsg)) return { kind: 'mercator' };
  for (const [from, south] of [
    [UTM_NORTH_FROM, false],
    [UTM_SOUTH_FROM, true],
  ] as const) {
    if (epsg >= from && epsg < from + UTM_ZONES)
      return { kind: 'utm', zone: epsg - from + 1, south };
  }
  return null;
}

/** WGS 84's ellipsoid. */
const A = 6_378_137;
const F = 1 / 298.257223563;
const RADIANS = Math.PI / 180;
const UTM_K0 = 0.9996;
const UTM_FALSE_EASTING = 500_000;
const UTM_FALSE_NORTHING_SOUTH = 10_000_000;
const ZONE_WIDTH_DEG = 6;
const FIRST_ZONE_WEST_DEG = -183;

/** Krüger's series to n⁴: millimetre-true across a zone (Karney, "Transverse Mercator with an accuracy of a few nanometres"). */
const N = F / (2 - F);
const A_RECT = (A / (1 + N)) * (1 + N ** 2 / 4 + N ** 4 / 64);
const ALPHA = [
  N / 2 - (2 / 3) * N ** 2 + (5 / 16) * N ** 3 + (41 / 180) * N ** 4,
  (13 / 48) * N ** 2 - (3 / 5) * N ** 3 + (557 / 1440) * N ** 4,
  (61 / 240) * N ** 3 - (103 / 140) * N ** 4,
  (49561 / 161280) * N ** 4,
];
const TWO_SQRT_N = (2 * Math.sqrt(N)) / (1 + N);

function utmOf(zone: number, south: boolean, { latitude, longitude }: LatLon): MapPoint {
  const centralDeg = FIRST_ZONE_WEST_DEG + zone * ZONE_WIDTH_DEG;
  const phi = latitude * RADIANS;
  const lambda = (longitude - centralDeg) * RADIANS;
  const t = Math.sinh(
    Math.atanh(Math.sin(phi)) - TWO_SQRT_N * Math.atanh(TWO_SQRT_N * Math.sin(phi)),
  );
  const xi = Math.atan2(t, Math.cos(lambda));
  const eta = Math.atanh(Math.sin(lambda) / Math.sqrt(1 + t * t));
  let x = eta;
  let y = xi;
  ALPHA.forEach((alpha, i) => {
    const j = 2 * (i + 1);
    x += alpha * Math.cos(j * xi) * Math.sinh(j * eta);
    y += alpha * Math.sin(j * xi) * Math.cosh(j * eta);
  });
  return {
    x: UTM_FALSE_EASTING + UTM_K0 * A_RECT * x,
    y: (south ? UTM_FALSE_NORTHING_SOUTH : 0) + UTM_K0 * A_RECT * y,
  };
}

/** Where a point on the globe lies in a map system. */
export function projected(system: MapSystem, at: LatLon): MapPoint {
  switch (system.kind) {
    case 'geographic':
      return { x: at.longitude, y: at.latitude };
    case 'mercator':
      return {
        x: A * at.longitude * RADIANS,
        y: A * Math.log(Math.tan(Math.PI / 4 + (at.latitude * RADIANS) / 2)),
      };
    case 'utm':
      return utmOf(system.zone, system.south, at);
  }
}

const E2 = F * (2 - F);

/**
 * A metre north and a metre east on the ellipsoid at a latitude, in degrees: by its two radii of
 * curvature, so a metre is a metre at every latitude, never a round Earth's.
 */
function degreesPerMetre(latitude: number): { readonly north: number; readonly east: number } {
  const sin = Math.sin(latitude * RADIANS);
  const w = Math.sqrt(1 - E2 * sin * sin);
  const meridian = (A * (1 - E2)) / (w * w * w);
  const primeVertical = A / w;
  return {
    north: 1 / (meridian * RADIANS),
    east: 1 / (primeVertical * Math.cos(latitude * RADIANS) * RADIANS),
  };
}

/**
 * How the map system lies at a point: how many of its units a true metre east and a true metre
 * north are (they differ in WGS 84's degrees), and how far its north turns from true north,
 * clockwise — a UTM grid's convergence. Read from two steps of a metre on the globe, so it holds
 * for every system the same way.
 */
export function gridAt(
  system: MapSystem,
  at: LatLon,
): {
  readonly unitsPerMetreX: number;
  readonly unitsPerMetreY: number;
  readonly northTurnDeg: number;
} {
  const here = projected(system, at);
  const step = degreesPerMetre(at.latitude);
  const north = projected(system, { ...at, latitude: at.latitude + step.north });
  const east = projected(system, { ...at, longitude: at.longitude + step.east });
  const dNorth = { x: north.x - here.x, y: north.y - here.y };
  const dEast = { x: east.x - here.x, y: east.y - here.y };
  return {
    unitsPerMetreX: Math.hypot(dEast.x, dEast.y),
    unitsPerMetreY: Math.hypot(dNorth.x, dNorth.y),
    // True north drawn on the grid leans this far from grid north; the map turns back by it.
    northTurnDeg: Math.atan2(dNorth.x, dNorth.y) / RADIANS,
  };
}
