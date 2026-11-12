import type { CalendarDate } from './holidays';
import { localInstant } from './zone';

/**
 * A company month, `YYYY-MM` (`F1-10`): "this month" is the company's calendar month on its own
 * clock, never UTC's — what Money due sums and what the owner dashboard reads.
 */
export type Month = string;

/** `YYYY-MM`: how much of a company day names its month. */
const MONTH_TEXT = 'YYYY-MM'.length;

/** The month a company day falls in. */
export function monthOf(day: CalendarDate): Month {
  return day.slice(0, MONTH_TEXT);
}

/** The month `by` months from `month`: January's one before is the December before it. */
export function monthShifted(month: Month, by: number): Month {
  const [year = 0, number = 1] = month.split('-').map(Number);
  const index = year * 12 + (number - 1) + by;
  const shiftedYear = Math.floor(index / 12);
  return `${String(shiftedYear).padStart(4, '0')}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** The month's first day — how a month-keyed row (a target, a summary's claim) is keyed. */
export function firstDayOf(month: Month): CalendarDate {
  return `${month}-01`;
}

/** The epoch instants the month starts and the next one starts, on the company's clock. */
export function monthSpan(month: Month, timeZone: string): { from: number; to: number } {
  return {
    from: localInstant(firstDayOf(month), 0, timeZone),
    to: localInstant(firstDayOf(monthShifted(month, 1)), 0, timeZone),
  };
}
