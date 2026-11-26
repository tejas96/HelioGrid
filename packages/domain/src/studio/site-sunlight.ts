import type { Coordinate } from '../format/areas';
import { type HeightGrid, percentile } from './site-grid';
import {
  type Eye,
  type Skyline,
  skylineAt,
  skylineAtBearing,
  skylinesJoined,
} from './site-skyline';
import { sunAt } from './sun';

/**
 * Sunlight (`T-M05-002`, part g): the share of the year's sun a spot of a roof keeps, 100 % where
 * nothing shades it. The clear-sky sun on the 21st of each month, every half hour, weighed by how
 * high it stands; the sky's own light counted too, cut by how much of the sky the spot sees. It is
 * shade, never energy — PVGIS is the one energy source (`07-integrations.md` §1) — and it reads
 * the sun chart's own skyline, so the two agree.
 */

export interface SunSample {
  readonly azimuthDeg: number;
  readonly elevationDeg: number;
  /** How much the sun at this height lights a level roof: the sine of its height. */
  readonly weight: number;
}

/** The share of a clear day's light on a level roof that comes from the sky, not the sun's disc. */
const SKY_SHARE = 0.2;
const MONTHS = 12;
const SAMPLE_DAY = 21;
const HALF_HOUR_MS = 1_800_000;
const DAY_MS = 86_400_000;
const RADIANS = Math.PI / 180;
/** The sunlight key runs from 60 % (much shade) to 100 % (none). */
export const SUNLIGHT_KEY_FROM = 0.6;
export const SUNLIGHT_KEY_TO = 1;

/** The year's sun at a place: the 21st of each month, every half hour it is up. */
export function yearSunSamples(place: Coordinate, year: number): SunSample[] {
  const samples: SunSample[] = [];
  for (let month = 0; month < MONTHS; month += 1) {
    const start = Date.UTC(year, month, SAMPLE_DAY);
    for (let at = start; at < start + DAY_MS; at += HALF_HOUR_MS) {
      const sun = sunAt(place, at);
      if (sun.elevationDegrees <= 0) continue;
      samples.push({
        azimuthDeg: sun.azimuthDegrees,
        elevationDeg: sun.elevationDegrees,
        weight: Math.sin(sun.elevationDegrees * RADIANS),
      });
    }
  }
  return samples;
}

/**
 * How much of the sky a spot sees, 0 to 1: the sky's light on a level roof under its skyline, the
 * mean of the squared cosine of the skyline's angle round the compass.
 */
export function skyViewOf(skyline: Skyline): number {
  if (skyline.elevationsDeg.length === 0) return 1;
  const sum = skyline.elevationsDeg.reduce((all, angle) => all + Math.cos(angle * RADIANS) ** 2, 0);
  return sum / skyline.elevationsDeg.length;
}

/** The share of the year's sun a spot under `skyline` keeps, 0 to 1. */
export function sunShareOf(skyline: Skyline, samples: readonly SunSample[]): number {
  let all = 0;
  let kept = 0;
  for (const sample of samples) {
    all += sample.weight;
    if (sample.elevationDeg >= skylineAtBearing(skyline, sample.azimuthDeg)) kept += sample.weight;
  }
  const direct = all === 0 ? 1 : kept / all;
  return (1 - SKY_SHARE) * direct + SKY_SHARE * skyViewOf(skyline);
}

/**
 * The share each eye keeps, on the height map and under the far hills, in the order given — the
 * Web Worker sends them back as they come, so a big roof fills in while it is worked.
 */
export function sunSharesOf(
  grid: HeightGrid,
  eyes: readonly Eye[],
  samples: readonly SunSample[],
  far: Skyline | null,
  reachM?: number,
): number[] {
  return eyes.map((eye) =>
    sunShareOf(skylinesJoined(skylineAt(grid, eye, undefined, reachM), far), samples),
  );
}

/** A roof's sunlight at a glance: its shadiest tenth, its middle and its sunniest tenth. */
export function sunlightSpread(shares: readonly number[]): {
  low: number;
  middle: number;
  high: number;
} | null {
  if (shares.length === 0) return null;
  return {
    low: percentile(shares, 0.1),
    middle: percentile(shares, 0.5),
    high: percentile(shares, 0.9),
  };
}
