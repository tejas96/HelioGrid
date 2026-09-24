import type { CalendarDate } from './holidays';

/**
 * What a wall clock reads at an instant, in a named zone — the ONE place that asks (`F3-19`,
 * `F3-22`). It lives in the format slice with the rest of the date and time implementation
 * because `Intl` is the implementation: a second one anywhere else is the drift `F3-19` forbids,
 * and the format invariant refuses it.
 *
 * Pure: the instant arrives as epoch milliseconds and no `Date` is constructed
 * (`packages/domain/CLAUDE.md`).
 */

/** One calendar day on a clock with no daylight shift. A zone's own day is `localDate`'s answer. */
export const MS_PER_DAY = 24 * 60 * 60 * 1_000;

interface LocalParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly minutes: number;
}

function localParts(instant: number, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  /* Every part asked for above is present, so the lookup always finds one. */
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    /* `en-GB` under `hour12: false` is an h23 cycle: midnight reads 00, never 24. */
    minutes: read('hour') * 60 + read('minute'),
  };
}

/** The calendar day that zone's wall clock reads at this instant, as `YYYY-MM-DD`. */
export function localDate(instant: number, timeZone: string): CalendarDate {
  const { year, month, day } = localParts(instant, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Minutes past local midnight at this instant, on that zone's clock. */
export function localMinutes(instant: number, timeZone: string): number {
  return localParts(instant, timeZone).minutes;
}

/** How far the zone stands from UTC at this instant, in milliseconds. */
function offsetMs(instant: number, timeZone: string): number {
  const local = localParts(instant, timeZone);
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, 0, local.minutes);
  /* Seconds and milliseconds are not read above, so compare on the minute. */
  return asUtc - Math.floor(instant / 60_000) * 60_000;
}

/**
 * The instant at which that zone's clock next reads `minutesPastMidnight`, at or after `from`.
 *
 * The offset is taken at the ANSWER rather than at `from`: a time that falls on the morning a
 * zone moves onto daylight saving stands an hour earlier in UTC than the starting offset
 * implies, and reading it once would put the answer sixty minutes late.
 */
export function nextLocalTime(from: number, minutesPastMidnight: number, timeZone: string): number {
  const local = localParts(from, timeZone);
  const day = local.day + (minutesPastMidnight > local.minutes ? 0 : 1);
  const wall = Date.UTC(local.year, local.month - 1, day, 0, minutesPastMidnight);
  const guess = wall - offsetMs(from, timeZone);
  return wall - offsetMs(guess, timeZone);
}
