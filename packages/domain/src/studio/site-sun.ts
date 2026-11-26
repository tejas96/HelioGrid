import type { Coordinate } from '../format/areas';
import { type SunPosition, sunAt } from './sun';

/**
 * The sun bar's days and hours (`T-M05-002`, part g): Winter, Summer, Equinox and Today for the
 * site's half of the globe, the day from sunrise to sunset on the site's own clock — its IANA time
 * zone read through `Intl`, so summer time is right — and the sun's path across it.
 */

/**
 * The day chips. North of 10° Winter is 21 Dec; south of −10° it is 21 Jun; between, where
 * winter and summer mean little, the chips read as their dates.
 */
export const SUN_DAYS = ['winter', 'summer', 'june', 'december', 'equinox', 'today'] as const;
export type SunDay = (typeof SUN_DAYS)[number];

/** A day of the year: month 1 to 12. */
export interface CalendarDay {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface SunDayChip {
  readonly key: SunDay;
  readonly on: CalendarDay;
}

/** Within this of the equator the chips read as dates. */
const TROPICS_NAMED_FROM_DEG = 10;
const JUNE = 6;
const DECEMBER = 12;
const MARCH = 3;
const SOLSTICE_DAY = 21;
const EQUINOX_DAY = 20;

/** The four day chips for a site's latitude, in the year of `today`. */
export function sunDayChips(latitude: number, today: CalendarDay): SunDayChip[] {
  const { year } = today;
  const june = { year, month: JUNE, day: SOLSTICE_DAY };
  const december = { year, month: DECEMBER, day: SOLSTICE_DAY };
  const equinox: SunDayChip = { key: 'equinox', on: { year, month: MARCH, day: EQUINOX_DAY } };
  const now: SunDayChip = { key: 'today', on: today };
  if (Math.abs(latitude) < TROPICS_NAMED_FROM_DEG) {
    return [{ key: 'june', on: june }, { key: 'december', on: december }, equinox, now];
  }
  const north = latitude > 0;
  return [
    { key: 'winter', on: north ? december : june },
    { key: 'summer', on: north ? june : december },
    equinox,
    now,
  ];
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
/** The sun's top edge meets the horizon with refraction: the sun's middle 0.833° below it. */
const SUNRISE_ELEVATION_DEG = -0.833;
/** The day is searched in steps this long, then each crossing bisected to the second. */
const SEARCH_STEP_MS = 10 * MS_PER_MINUTE;
const BISECTIONS = 10;

/** The site clock's offset from UTC at an instant, in minutes (summer time included). */
export function zoneOffsetMinutes(timeZone: string, atMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(atMs);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((one) => one.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return Math.round((asUtc - Math.floor(atMs / 1000) * 1000) / MS_PER_MINUTE);
}

/** The instant the site's clock reads midnight at the start of a day. */
export function siteMidnightMs(timeZone: string, on: CalendarDay): number {
  const utc = Date.UTC(on.year, on.month - 1, on.day);
  const guess = utc - zoneOffsetMinutes(timeZone, utc) * MS_PER_MINUTE;
  return utc - zoneOffsetMinutes(timeZone, guess) * MS_PER_MINUTE;
}

/** The hour and minute the site's clock reads at an instant. */
export function siteClockOf(timeZone: string, atMs: number): { hour: number; minute: number } {
  const local = atMs + zoneOffsetMinutes(timeZone, atMs) * MS_PER_MINUTE;
  const intoDay = ((local % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
  return {
    hour: Math.floor(intoDay / MS_PER_HOUR),
    minute: Math.floor((intoDay % MS_PER_HOUR) / MS_PER_MINUTE),
  };
}

/**
 * A day of sun at the site: sunrise and sunset, or the polar night (the sun stays down) or the
 * midnight sun (it stays up), when the day has no crossing.
 */
export type SunDayLight =
  | { readonly kind: 'day'; readonly sunriseMs: number; readonly sunsetMs: number }
  | { readonly kind: 'polar_night' }
  | { readonly kind: 'midnight_sun'; readonly fromMs: number; readonly toMs: number };

const up = (place: Coordinate, atMs: number) =>
  sunAt(place, atMs).elevationDegrees > SUNRISE_ELEVATION_DEG;

function crossing(place: Coordinate, fromMs: number, toMs: number): number {
  let low = fromMs;
  let high = toMs;
  const rising = !up(place, fromMs);
  for (let i = 0; i < BISECTIONS; i += 1) {
    const middle = (low + high) / 2;
    if (up(place, middle) === rising) high = middle;
    else low = middle;
  }
  return Math.round((low + high) / 2);
}

/** The first time from `fromMs`, within `spanMs`, the sun rises (or sets); `null` for none. */
function nextCrossing(
  place: Coordinate,
  fromMs: number,
  spanMs: number,
  rising: boolean,
): number | null {
  const to = fromMs + spanMs;
  let was = up(place, fromMs);
  for (let at = fromMs; at < to; at += SEARCH_STEP_MS) {
    const next = Math.min(to, at + SEARCH_STEP_MS);
    const now = up(place, next);
    if (rising ? !was && now : was && !now) return crossing(place, at, next);
    was = now;
  }
  return null;
}

/**
 * The sun's day at the site on a day of its own calendar: its first sunrise and the sunset after
 * it, which may fall after midnight (Reykjavik in June sets at 00:04). With no sunrise that day it
 * is the polar night, or the midnight sun until it sets.
 */
export function sunDayLightOf(place: Coordinate, timeZone: string, on: CalendarDay): SunDayLight {
  const start = siteMidnightMs(timeZone, on);
  const end = start + MS_PER_DAY;
  const sunrise = nextCrossing(place, start, MS_PER_DAY, true);
  if (sunrise !== null) {
    const sunset = nextCrossing(place, sunrise, MS_PER_DAY, false);
    return sunset === null
      ? { kind: 'midnight_sun', fromMs: sunrise, toMs: end }
      : { kind: 'day', sunriseMs: sunrise, sunsetMs: sunset };
  }
  const sunset = nextCrossing(place, start, MS_PER_DAY, false);
  if (sunset !== null) return { kind: 'midnight_sun', fromMs: start, toMs: sunset };
  return up(place, start)
    ? { kind: 'midnight_sun', fromMs: start, toMs: end }
    : { kind: 'polar_night' };
}

export interface SunPathPoint extends SunPosition {
  readonly atMs: number;
}

/** The sun's path from one instant to another, a point each `stepMs`, the last at `toMs`. */
export function sunPathOf(
  place: Coordinate,
  fromMs: number,
  toMs: number,
  stepMs: number,
): SunPathPoint[] {
  const path: SunPathPoint[] = [];
  for (let at = fromMs; at < toMs; at += stepMs) path.push({ atMs: at, ...sunAt(place, at) });
  path.push({ atMs: toMs, ...sunAt(place, toMs) });
  return path;
}

/**
 * The day line's ticks: the instants between `fromMs` and `toMs` when the site's clock reads a
 * whole hour that is a multiple of `everyHours` (2 on a laptop, 3 on a phone).
 */
export function sunDayTicks(
  timeZone: string,
  fromMs: number,
  toMs: number,
  everyHours: number,
): number[] {
  const ticks: number[] = [];
  const offset = zoneOffsetMinutes(timeZone, fromMs) * MS_PER_MINUTE;
  let at = Math.ceil((fromMs + offset) / MS_PER_HOUR) * MS_PER_HOUR - offset;
  for (; at <= toMs; at += MS_PER_HOUR) {
    if (siteClockOf(timeZone, at).minute !== 0) continue;
    if (siteClockOf(timeZone, at).hour % everyHours === 0) ticks.push(at);
  }
  return ticks;
}
