import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import type { TimePreset, TimeString } from './TimeField.types';

const RE24 = /^([01]?\d|2[0-3])[:.\s]?([0-5]\d)$/;
const RE12 = /^(1[0-2]|0?[1-9])[:.\s]?([0-5]\d)\s*([ap])\.?m?\.?$/i;

/** "17:00" → 1020 minutes. Null if unparseable. Both clock spellings parse. */
export function parseTime(input: string): number | null {
  if (typeof input !== 'string') {
    return null;
  }
  const raw = input.trim();
  const m12 = RE12.exec(raw);
  if (m12 !== null) {
    const hours = m12[1];
    const minutes = m12[2];
    const half = m12[3];
    if (hours === undefined || minutes === undefined || half === undefined) {
      return null;
    }
    const h = Number(hours) % 12;
    return (half.toLowerCase() === 'p' ? h + 12 : h) * 60 + Number(minutes);
  }
  const m24 = RE24.exec(raw);
  if (m24 === null) {
    return null;
  }
  const hours = m24[1];
  const minutes = m24[2];
  if (hours === undefined || minutes === undefined) {
    return null;
  }
  return Number(hours) * 60 + Number(minutes);
}

/** 1020 → "17:00". */
export function formatTime(minutes: number): TimeString {
  if (Number.isNaN(minutes)) {
    return '';
  }
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = String(Math.floor(wrapped / 60)).padStart(2, '0');
  const m = String(wrapped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Normalises "9:00" / "0900" / "9.00" to "09:00". Null if unparseable. */
export function normaliseTime(input: string): TimeString | null {
  const minutes = parseTime(input);
  return minutes === null ? null : formatTime(minutes);
}

/**
 * What the user reads. THE VALUE IS 24-HOUR; THE DISPLAY IS THE MARKET'S (F1 / F3-20). "HH:MM" is
 * the storage and prop spelling everywhere — one canonical form means no AM/PM ambiguity in the
 * data — while what a user reads follows the pack's clock, so a 12-hour market renders "5:00 PM".
 *
 * A module function cannot call a hook, so the market's format is THREADED IN as a parameter — the
 * pattern `DocumentPreview`'s `resolveDocument` and `DataTable`'s total logic already use. It
 * defaults to `IN_FORMAT`, the provider's own documented default, so a field rendered outside a
 * `MarketProvider` still reads the India pack rather than an invented one. Entry accepts both
 * spellings either way — `parseTime` reads 12-hour and 24-hour regardless of the pack.
 */
export function showTime(value: TimeString, format: MarketFormat = IN_FORMAT): string {
  if (value === '') {
    return '';
  }
  const canonical = normaliseTime(value);
  return canonical === null ? value : format.time(canonical);
}

/**
 * The entry shape the placeholder and the unparseable refusal both name. A 12-hour market is told
 * to type "h:mm AM", because "HH:MM" is not the spelling it is being shown.
 */
export function timeShape(
  placeholder: string | undefined,
  format: MarketFormat = IN_FORMAT,
): string {
  return placeholder ?? (format.pack.clock === '12h' ? 'h:mm AM' : 'HH:MM');
}

/** A bare string preset is labelled with the time itself, in the market's spelling. */
export function resolvePreset(
  preset: TimeString | TimePreset,
  format: MarketFormat = IN_FORMAT,
): TimePreset {
  if (typeof preset === 'string') {
    return { value: preset, label: showTime(preset, format) };
  }
  return preset;
}

/** "between 09:00 and 19:00" — the permitted hours, in words, for the refusal. */
export function windowWords(
  minMinutes: number | null,
  maxMinutes: number | null,
  format: MarketFormat = IN_FORMAT,
): string {
  const show = (minutes: number) => showTime(formatTime(minutes), format);
  if (minMinutes !== null && maxMinutes !== null) {
    return `between ${show(minMinutes)} and ${show(maxMinutes)}`;
  }
  if (minMinutes !== null) {
    return `no earlier than ${show(minMinutes)}`;
  }
  if (maxMinutes !== null) {
    return `no later than ${show(maxMinutes)}`;
  }
  return '';
}

/** Outside the permitted window — refused, never clamped. */
export function outsideWindow(
  minutes: number,
  minMinutes: number | null,
  maxMinutes: number | null,
): boolean {
  return (
    (minMinutes !== null && minutes < minMinutes) || (maxMinutes !== null && minutes > maxMinutes)
  );
}

/**
 * The refusal, naming the window. One declaration so the two platform halves cannot word a
 * compliance boundary two ways.
 */
export function refusalFor(
  minutes: number,
  minMinutes: number | null,
  maxMinutes: number | null,
  windowName: string | undefined,
  format: MarketFormat = IN_FORMAT,
): string {
  const named = windowName ?? 'permitted';
  const words = windowWords(minMinutes, maxMinutes, format);
  const at = showTime(formatTime(minutes), format);
  return `${at} is outside the ${named} window — calls are allowed ${words}.`;
}

/** The unparseable refusal — it keeps what was typed visible and states the shape. */
export function shapeRefusalFor(
  raw: string,
  placeholder: string,
  format: MarketFormat = IN_FORMAT,
): string {
  return `"${raw}" isn't a time. Enter it as ${placeholder}, like ${showTime('17:00', format)}.`;
}

/** Time helpers reachable from the window namespace: `Times.format(1020)`. */
export const Times = {
  parse: parseTime,
  format: formatTime,
  normalise: normaliseTime,
};
