import type { Coordinate } from '../format/areas';

/** Where the sun stands: its compass bearing (0 north, 90 east) and its height above the horizon. */
export interface SunPosition {
  readonly azimuthDegrees: number;
  readonly elevationDegrees: number;
}

const RADIANS = Math.PI / 180;
const HOURS_TO_NOON = 12;
/** The earth turns 15 degrees of longitude an hour. */
const DEGREES_PER_HOUR = 15;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
/** Days from the Unix epoch to J2000.0, the epoch the formulas count from. */
const UNIX_TO_J2000_DAYS = 10_957.5;

const wrap = (degrees: number, turn: number): number => ((degrees % turn) + turn) % turn;

/**
 * The sun for a place and an instant (epoch milliseconds), from the low-precision solar formulas of the US Naval
 * Observatory: within about a degree from 1950 to 2050 — finer than a shadow on a roof shows.
 */
export function sunAt(place: Coordinate, atMs: number): SunPosition {
  const days = atMs / MS_PER_DAY - UNIX_TO_J2000_DAYS;
  const anomaly = wrap(357.529 + 0.98560028 * days, 360) * RADIANS;
  const meanLongitude = wrap(280.459 + 0.98564736 * days, 360);
  const longitude =
    (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RADIANS;
  const obliquity = (23.439 - 0.00000036 * days) * RADIANS;
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude));
  const siderealHours = wrap(18.697374558 + 24.06570982441908 * days, 24);
  const hourAngle = (siderealHours * DEGREES_PER_HOUR + place.longitude) * RADIANS - rightAscension;
  const latitude = place.latitude * RADIANS;
  const elevation = Math.asin(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const azimuth = Math.atan2(
    -Math.sin(hourAngle),
    Math.tan(declination) * Math.cos(latitude) - Math.sin(latitude) * Math.cos(hourAngle),
  );
  return {
    azimuthDegrees: wrap(azimuth / RADIANS, 360),
    elevationDegrees: elevation / RADIANS,
  };
}

/** Below this height the sun lights a scene too low and too dim to read a roof by. */
const SCENE_SUN_MIN_ELEVATION = 15;

/**
 * The sun a scene opens with: the real sun at the site now, or — before sunrise, after sunset and
 * in the low light near either — the sun of the same day at the site's own noon.
 */
export function sceneSunAt(place: Coordinate, nowMs: number): SunPosition {
  const real = sunAt(place, nowMs);
  if (real.elevationDegrees >= SCENE_SUN_MIN_ELEVATION) return real;
  const utcMidnight = Math.floor(nowMs / MS_PER_DAY) * MS_PER_DAY;
  const localNoonHours = HOURS_TO_NOON - place.longitude / DEGREES_PER_HOUR;
  return sunAt(place, utcMidnight + localNoonHours * MS_PER_HOUR);
}
