import type { CalendarValue, DateRange, ISODate } from './DatePicker.types';

/** "YYYY-MM-DD" from a local Date. */
export function iso(d: Date): ISODate {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** An ISO date read at local midnight, so a timezone cannot shift it by a day. */
export function parse(value: ISODate | Date | null | undefined): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** The set a `mode="set"` calendar holds. */
export function asSet(value: CalendarValue | undefined): ISODate[] {
  return Array.isArray(value) ? value : [];
}

/** The span a `mode="range"` calendar holds. */
export function asRange(value: CalendarValue | undefined): DateRange {
  if (value !== undefined && !Array.isArray(value) && typeof value === 'object') {
    return value;
  }
  return { from: null, to: null };
}

/**
 * The month's cells, leading blanks included.
 *
 * The market's first column, not Monday's: `firstDayOfWeek` is ISO (1 = Mon … 7 = Sun) and
 * `getDay()` is Sunday-based, so `7 % 7 = 0` lines Sunday up with column one. The grid used to
 * hardcode `(first.getDay() + 6) % 7` — a Monday start — while India's week starts SUNDAY.
 */
export function monthCells(view: Date, firstDayOfWeek: number): Array<Date | null> {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startIdx = firstDayOfWeek % 7;
  const offset = (first.getDay() - startIdx + 7) % 7;
  const daysIn = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < offset; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysIn; d += 1) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  }
  return cells;
}

/** The first of the month a date falls in. */
export function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** The weekday name for a date, in the market's column order. */
export function weekdayOf(d: Date, longNames: string[], firstDayOfWeek: number): string {
  const startIdx = firstDayOfWeek % 7;
  return longNames[(d.getDay() - startIdx + 7) % 7] ?? '';
}
