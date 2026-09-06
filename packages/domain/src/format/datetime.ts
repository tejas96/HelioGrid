import type { FormatPack } from './pack';

/**
 * The ONE date and time implementation (`F3-19`, `F3-22`). No surface composes a date string,
 * and no surface renders a user-facing time in any zone but the tenant's.
 *
 * **Two facts a reader usually gets wrong here.**
 *
 * `03/04` is two different days in two markets and looks correct in both, so the FIELD ORDER is
 * pack data. And the month NAMES come from `pack.locale` — the market's — not from the
 * reader's language: `F3-19`'s acceptance requires a date to stay character-identical when a
 * user switches interface language, so `12 Mar 2026` reads the same in English, Hindi and
 * Marathi. Only the words around it change.
 *
 * `timeZone` is passed to every Intl call on purpose. Omit it and the value renders in the
 * DEVICE's zone, which is the bug `F3-22` names: an 09:00 slot read as 03:30 by a rep whose
 * phone is abroad.
 */

/** Reference dates for NAMES ONLY, read in UTC so no zone can shift them by a day. */
const NAME_YEAR = 2021;
/** `2021-08-01` is a Sunday, which makes the weekday walk arithmetic instead of a lookup table. */
const SUNDAY = Date.UTC(2021, 7, 1);
const DAY_MS = 86_400_000;
const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/**
 * Epoch milliseconds, or `null` for anything unparseable.
 *
 * `Date.parse` rather than `new Date(…)`: constructing a Date is how a clock read gets into a
 * pure package, so `check:adherence` bans the spelling outright (ADR-0021). Parsing a stamp the
 * caller already holds reads no clock, and `Intl.DateTimeFormat` formats an epoch directly.
 */
function toEpoch(value: string | Date | number): number | null {
  const epoch = typeof value === 'string' ? Date.parse(value) : Number(value);
  return Number.isNaN(epoch) ? null : epoch;
}

/** `2026-03-12` → `12 Mar 2026` under the IN pack (`F1-48`), on the tenant's zone. */
export function formatDate(pack: FormatPack, value: string | Date | number): string {
  const epoch = toEpoch(value);
  if (epoch === null) return typeof value === 'string' ? value : '';
  return new Intl.DateTimeFormat(pack.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: pack.timeZone,
  }).format(epoch);
}

/** A calendar's own heading — `March 2026`. */
export function formatMonthYear(pack: FormatPack, value: string | Date | number): string {
  const epoch = toEpoch(value);
  if (epoch === null) return '';
  return new Intl.DateTimeFormat(pack.locale, {
    month: 'long',
    year: 'numeric',
    timeZone: pack.timeZone,
  }).format(epoch);
}

/**
 * `17:00` → `17:00` or `5:00 PM`, by the pack's clock. Storage stays 24-hour either way.
 *
 * Takes wall-clock digits rather than an instant: a calling window or a send hour IS a wall
 * clock on the tenant's zone (`F1-10`), and converting it through an instant would move it.
 */
export function formatTime(pack: FormatPack, hhmm: string): string {
  const match = HHMM.exec(hhmm.trim());
  const hours = match?.[1];
  const minutes = match?.[2];
  if (hours === undefined || minutes === undefined) return hhmm;
  const hour = Number(hours);
  if (pack.clock === '24h') return `${String(hour).padStart(2, '0')}:${minutes}`;
  return `${hour % 12 || 12}:${minutes} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** 12 month names in calendar order — `long` for a heading, `short` for a compact strip. */
export function monthNames(
  pack: FormatPack,
  style: 'long' | 'short' | 'narrow' = 'long',
): string[] {
  const format = new Intl.DateTimeFormat(pack.locale, { month: style, timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, month) => format.format(Date.UTC(NAME_YEAR, month, 15)));
}

/** 7 weekday names STARTING AT THIS MARKET'S FIRST DAY — a grid's column order, not Monday's. */
export function weekdayNames(
  pack: FormatPack,
  style: 'narrow' | 'short' | 'long' = 'narrow',
): string[] {
  const format = new Intl.DateTimeFormat(pack.locale, { weekday: style, timeZone: 'UTC' });
  /* 7 (Sunday) → 0, 1 (Monday) → 1: the ISO number mapped onto the reference walk. */
  const start = pack.firstDayOfWeek % 7;
  return Array.from({ length: 7 }, (_, offset) =>
    format.format(SUNDAY + (start + offset) * DAY_MS),
  );
}
