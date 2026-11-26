import type { Coordinate } from '../format/areas';
import {
  type CalendarDay,
  type SunDay,
  type SunDayChip,
  type SunDayLight,
  type SunPathPoint,
  siteClockOf,
  siteMidnightMs,
  sunDayChips,
  sunDayLightOf,
  sunDayTicks,
  sunPathOf,
  zoneOffsetMinutes,
} from './site-sun';
import { type SunPosition, sunAt } from './sun';

/**
 * The sun bar (`T-M05-002`, part g, board G8–G13): the day picked from its chips and the moment
 * on its day line, sunrise to sunset on the site's own clock; the sun there, its bearing, and the
 * day's path with its hours. The pick is the moment's, never stored.
 */

/** The day picked and the moment on it. */
export interface SunPick {
  readonly day: SunDay;
  readonly atMs: number;
}

/** The eight compass points a bearing is named by. */
export const COMPASS_POINTS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
export type CompassPoint = (typeof COMPASS_POINTS)[number];

export interface SunClock {
  readonly hour: number;
  readonly minute: number;
  /** `09:05`: the clock as the market's time format reads it. */
  readonly hhmm: string;
}

/** The day line: sunrise to sunset, the handle on it, and its hour ticks. */
export interface SunDayLine {
  readonly fromMs: number;
  readonly toMs: number;
  /** Minutes from sunrise to the handle, and to sunset: the line's value and its end. */
  readonly minutes: number;
  readonly spanMinutes: number;
  readonly at: SunClock;
  readonly rise: SunClock;
  readonly set: SunClock;
  /** Each whole hour the line marks, as minutes from sunrise. */
  readonly ticks: readonly { readonly minutes: number; readonly at: SunClock }[];
}

export interface SunBarView {
  readonly chips: readonly SunDayChip[];
  readonly day: SunDay;
  readonly date: CalendarDay;
  readonly light: SunDayLight['kind'];
  /** `null` where the sun stays down all day. */
  readonly line: SunDayLine | null;
  /** The sun at the handle; `null` while it is under the horizon. */
  readonly sun: SunPosition | null;
  readonly bearing: CompassPoint | null;
  /** The day's path over the horizon, a point each `PATH_STEP_MS`. */
  readonly path: readonly SunPathPoint[];
  /** The whole hours the path marks, as the line's ticks. */
  readonly hours: readonly (SunPathPoint & { readonly at: SunClock })[];
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const HOURS_PER_ZONE = 15;
/** The widest zones the world uses, east and west of Greenwich. */
const ZONE_EAST_MAX = 14;
const ZONE_WEST_MAX = 12;
const PATH_STEP_MS = 10 * MS_PER_MINUTE;
const TURN = 360;

/**
 * The site's time zone: the one the data names, else the hour zone its longitude lies in (at sea,
 * where no country's clock runs). `Etc/GMT` counts the other way: GMT-5 is five hours east.
 */
export function siteTimeZoneOf(timeZone: string | null, longitude: number): string {
  if (timeZone !== null) return timeZone;
  const hours = Math.max(
    -ZONE_WEST_MAX,
    Math.min(ZONE_EAST_MAX, Math.round(longitude / HOURS_PER_ZONE)),
  );
  if (hours === 0) return 'Etc/UTC';
  return hours > 0 ? `Etc/GMT-${hours}` : `Etc/GMT+${-hours}`;
}

/** The day the site's clock reads at an instant. */
export function siteDayOf(timeZone: string, atMs: number): CalendarDay {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(atMs);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((one) => one.type === type)?.value ?? 0);
  return { year: part('year'), month: part('month'), day: part('day') };
}

/** The compass point a bearing is nearest. */
export function compassPointOf(azimuthDegrees: number): CompassPoint {
  const slice = TURN / COMPASS_POINTS.length;
  const index = Math.round((((azimuthDegrees % TURN) + TURN) % TURN) / slice);
  return COMPASS_POINTS[index % COMPASS_POINTS.length] as CompassPoint;
}

/** The span the line runs: sunrise to sunset, the whole day under the midnight sun, or none. */
function spanOf(light: SunDayLight): { fromMs: number; toMs: number } | null {
  if (light.kind === 'day') return { fromMs: light.sunriseMs, toMs: light.sunsetMs };
  return light.kind === 'midnight_sun' ? { fromMs: light.fromMs, toMs: light.toMs } : null;
}

/** The middle of a day of the site's clock: where a pick lands when the sun stays down. */
const middayOf = (timeZone: string, on: CalendarDay) =>
  siteMidnightMs(timeZone, on) + MS_PER_DAY / 2;

/** A moment kept on the day's line: on it, or at its nearer end. */
function onLine(atMs: number, light: SunDayLight, timeZone: string, on: CalendarDay): number {
  const span = spanOf(light);
  if (span === null) return middayOf(timeZone, on);
  return Math.min(span.toMs, Math.max(span.fromMs, atMs));
}

const dayOf = (chips: readonly SunDayChip[], day: SunDay): CalendarDay | null =>
  chips.find((chip) => chip.key === day)?.on ?? null;

/**
 * The bar as it opens: today, at the site's now — or, before sunrise and after sunset, at the
 * middle of today's sun.
 */
export function sunPickOpened(place: Coordinate, timeZone: string, nowMs: number): SunPick {
  const today = siteDayOf(timeZone, nowMs);
  const light = sunDayLightOf(place, timeZone, today);
  const span = spanOf(light);
  const inside = span !== null && nowMs >= span.fromMs && nowMs <= span.toMs;
  const atMs = span === null ? middayOf(timeZone, today) : (span.fromMs + span.toMs) / 2;
  return { day: 'today', atMs: inside ? nowMs : Math.round(atMs) };
}

/** Another day chip: the same clock time on that day, kept within its sun. */
export function sunPickDay(
  pick: SunPick,
  day: SunDay,
  place: Coordinate,
  timeZone: string,
  nowMs: number,
): SunPick {
  const chips = sunDayChips(place.latitude, siteDayOf(timeZone, nowMs));
  const from = dayOf(chips, pick.day);
  const to = dayOf(chips, day);
  if (to === null) return pick;
  const intoDay = from === null ? MS_PER_DAY / 2 : pick.atMs - siteMidnightMs(timeZone, from);
  const light = sunDayLightOf(place, timeZone, to);
  return { day, atMs: onLine(siteMidnightMs(timeZone, to) + intoDay, light, timeZone, to) };
}

/** The handle moved to `minutes` after sunrise, kept on the line. */
export function sunPickSlid(pick: SunPick, line: SunDayLine, minutes: number): SunPick {
  const atMs = line.fromMs + minutes * MS_PER_MINUTE;
  return { ...pick, atMs: Math.min(line.toMs, Math.max(line.fromMs, atMs)) };
}

const pad = (value: number) => String(value).padStart(2, '0');
function clockOf(timeZone: string, atMs: number): SunClock {
  const { hour, minute } = siteClockOf(timeZone, atMs);
  return { hour, minute, hhmm: `${pad(hour)}:${pad(minute)}` };
}
const minutesBetween = (fromMs: number, toMs: number) => (toMs - fromMs) / MS_PER_MINUTE;

/** A day of the bar, worked once for the day: everything but the moment on it. */
export interface SunBarDay {
  readonly chips: readonly SunDayChip[];
  readonly day: SunDay;
  readonly date: CalendarDay;
  readonly light: SunDayLight['kind'];
  /** The line's ends and hours; `null` where the sun stays down. */
  readonly span: Omit<SunDayLine, 'minutes' | 'at'> | null;
  readonly path: readonly SunPathPoint[];
  readonly hours: readonly (SunPathPoint & { readonly at: SunClock })[];
}

/**
 * A day of the bar: the chips, the day's sunrise and sunset with the whole hours between, and the
 * sun's path with its hours. It holds for every moment of the day, so a play works it once.
 */
export function sunBarDayOf(
  day: SunDay,
  place: Coordinate,
  timeZone: string,
  nowMs: number,
): SunBarDay {
  const chips = sunDayChips(place.latitude, siteDayOf(timeZone, nowMs));
  const date = dayOf(chips, day) ?? siteDayOf(timeZone, nowMs);
  const light = sunDayLightOf(place, timeZone, date);
  const range = spanOf(light);
  if (range === null)
    return { chips, day, date, light: light.kind, span: null, path: [], hours: [] };
  const ticks = sunDayTicks(timeZone, range.fromMs, range.toMs, 1).map((tick) => ({
    minutes: minutesBetween(range.fromMs, tick),
    at: clockOf(timeZone, tick),
  }));
  const hours = ticks
    .map((tick) => {
      const atMs = range.fromMs + tick.minutes * MS_PER_MINUTE;
      return { atMs, at: tick.at, ...sunAt(place, atMs) };
    })
    .filter((hour) => hour.elevationDegrees > 0);
  const path = sunPathOf(place, range.fromMs, range.toMs, PATH_STEP_MS).filter(
    (point) => point.elevationDegrees > 0,
  );
  const span = {
    ...range,
    spanMinutes: minutesBetween(range.fromMs, range.toMs),
    rise: clockOf(timeZone, range.fromMs),
    set: clockOf(timeZone, range.toMs),
    ticks,
  };
  return { chips, day, date, light: light.kind, span, path, hours };
}

/** The bar at a moment of its day: the handle, the clock, the sun and its compass point. */
export function sunBarAt(
  day: SunBarDay,
  atMs: number,
  place: Coordinate,
  timeZone: string,
): SunBarView {
  const { span, ...rest } = day;
  const sun = sunAt(place, atMs);
  const up = span !== null && sun.elevationDegrees > 0;
  const line =
    span === null
      ? null
      : { ...span, minutes: minutesBetween(span.fromMs, atMs), at: clockOf(timeZone, atMs) };
  return {
    ...rest,
    line,
    sun: up ? sun : null,
    bearing: up ? compassPointOf(sun.azimuthDegrees) : null,
  };
}

/** What the bar shows for a pick: its day, at the pick's moment. */
export function sunBarViewOf(
  pick: SunPick,
  place: Coordinate,
  timeZone: string,
  nowMs: number,
): SunBarView {
  return sunBarAt(sunBarDayOf(pick.day, place, timeZone, nowMs), pick.atMs, place, timeZone);
}

/** How long a whole day plays, and how long each hour shows under Reduce Motion. */
export const SUN_PLAY_MS = 6_000;
export const SUN_STEP_MS = 1_000;

/** The moment a play reaches after `elapsedMs` of playing from `startMs`. */
export function sunPlayedTo(line: SunDayLine, startMs: number, elapsedMs: number): number {
  const day = line.toMs - line.fromMs;
  return Math.min(line.toMs, startMs + (elapsedMs / SUN_PLAY_MS) * day);
}

/** Under Reduce Motion, play steps to the next whole hour of the site's clock, or to sunset. */
export function sunNextHour(line: SunDayLine, atMs: number, timeZone: string): number {
  const offset = zoneOffsetMinutes(timeZone, atMs) * MS_PER_MINUTE;
  const next = Math.floor((atMs + offset) / MS_PER_HOUR) * MS_PER_HOUR + MS_PER_HOUR - offset;
  return Math.min(line.toMs, next);
}
