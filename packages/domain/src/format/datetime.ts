import type { UiLanguage } from './languages';
import type { FormatPack } from './pack';
import { localMinutes } from './zone';

/**
 * The ONE date and time implementation (`F3-19`, `F3-22`). No surface composes a date string,
 * and no surface renders a user-facing time in any zone but the tenant's.
 *
 * **Two facts a reader usually gets wrong here.**
 *
 * `03/04` is two different days in two markets and looks correct in both, so the FIELD ORDER is
 * pack data. The month and weekday NAMES are the reader's words (`F3-22`): `12 Mar 2026` reads
 * `12 मार्च 2026` in Marathi. Only the names move — the order, the punctuation and the digits stay
 * the pack's, which is why a date is never formatted in the reader's locale whole: Marathi's own
 * pattern would print `12 मार्च, २०२६`.
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
 * pure package, so the Biome plugin `domain-clock` bans the spelling outright. Parsing a stamp the
 * caller already holds reads no clock, and `Intl.DateTimeFormat` formats an epoch directly.
 */
function toEpoch(value: string | Date | number): number | null {
  const epoch = typeof value === 'string' ? Date.parse(value) : Number(value);
  return Number.isNaN(epoch) ? null : epoch;
}

/** The reader's words in the market's region — `hi-IN` — so English keeps the market's `Sept`. */
function namesLocale(pack: FormatPack, language: UiLanguage): string {
  return `${language}-${pack.id}`;
}

/** A date in the pack's order, punctuation and digits, its month in the reader's words. */
function withReaderMonth(
  pack: FormatPack,
  language: UiLanguage,
  epoch: number,
  options: Intl.DateTimeFormatOptions,
): string {
  const zoned = { ...options, timeZone: pack.timeZone };
  const names = new Intl.DateTimeFormat(namesLocale(pack, language), zoned).formatToParts(epoch);
  return new Intl.DateTimeFormat(pack.locale, zoned)
    .formatToParts(epoch)
    .map((part) =>
      part.type === 'month'
        ? (names.find((name) => name.type === 'month')?.value ?? part.value)
        : part.value,
    )
    .join('');
}

/** `2026-03-12` → `12 Mar 2026` under the IN pack (`F1-48`), on the tenant's zone. */
export function formatDate(
  pack: FormatPack,
  value: string | Date | number,
  language: UiLanguage,
): string {
  const epoch = toEpoch(value);
  if (epoch === null) return typeof value === 'string' ? value : '';
  return withReaderMonth(pack, language, epoch, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * `2026-08-17` → `Monday`, the day's name in the reader's words, on the tenant's zone. A name alone
 * has no order to keep, so it is formatted whole: iOS's Hermes labels a lone weekday's part as no
 * `weekday`, and a swap by part would leave the market's English name.
 */
export function formatWeekday(
  pack: FormatPack,
  value: string | number,
  language: UiLanguage,
): string {
  const epoch = toEpoch(value);
  if (epoch === null) return '';
  return new Intl.DateTimeFormat(namesLocale(pack, language), {
    weekday: 'long',
    timeZone: pack.timeZone,
  }).format(epoch);
}

/**
 * What the tenant's wall clock read at an instant, by the pack's clock — `16:12` or `4:12 PM`.
 * An event's time (an item emitted, a call placed), where `formatTime` takes a slot's digits.
 */
export function formatClockAt(pack: FormatPack, value: string | number): string {
  const epoch = toEpoch(value);
  if (epoch === null) return '';
  const minutes = localMinutes(epoch, pack.timeZone);
  const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return formatTime(pack, hhmm);
}

/** A calendar's own heading — `March 2026`. */
export function formatMonthYear(
  pack: FormatPack,
  value: string | Date | number,
  language: UiLanguage,
): string {
  const epoch = toEpoch(value);
  if (epoch === null) return '';
  return withReaderMonth(pack, language, epoch, { month: 'long', year: 'numeric' });
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
  language: UiLanguage,
  style: 'long' | 'short' | 'narrow' = 'long',
): string[] {
  const format = new Intl.DateTimeFormat(namesLocale(pack, language), {
    month: style,
    timeZone: 'UTC',
  });
  return Array.from({ length: 12 }, (_, month) => format.format(Date.UTC(NAME_YEAR, month, 15)));
}

/** 7 weekday names STARTING AT THIS MARKET'S FIRST DAY — a grid's column order, not Monday's. */
export function weekdayNames(
  pack: FormatPack,
  language: UiLanguage,
  style: 'narrow' | 'short' | 'long' = 'narrow',
): string[] {
  const format = new Intl.DateTimeFormat(namesLocale(pack, language), {
    weekday: style,
    timeZone: 'UTC',
  });
  /* 7 (Sunday) → 0, 1 (Monday) → 1: the ISO number mapped onto the reference walk. */
  const start = pack.firstDayOfWeek % 7;
  return Array.from({ length: 7 }, (_, offset) =>
    format.format(SUNDAY + (start + offset) * DAY_MS),
  );
}
