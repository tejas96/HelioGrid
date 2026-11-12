import { type ClockTime, clockTime } from '../calling/clock-time';
import { type Month, monthOf, monthShifted } from '../format/month';
import { calendarDayAfter, localDate, localInstant, localMinutes } from '../format/zone';
import { WIN_RATE_WINDOW_DAYS } from './win-rate';

/** The win-rate window's start (`M13-23`): the company's midnight, `WIN_RATE_WINDOW_DAYS` days back. */
export function winRateWindowStart(now: number, timeZone: string): number {
  return localInstant(
    calendarDayAfter(localDate(now, timeZone), -WIN_RATE_WINDOW_DAYS),
    0,
    timeZone,
  );
}

/** When, on the first of a month, the summary of the month just ended is written (`M13-21`). */
export const SUMMARY_TIME: ClockTime = clockTime('09:00');

/**
 * The month whose summary is due now, or `null`: due on the first of a month at or after 09:00 on
 * the company's clock, and then of the month just ended. A claim row makes it once; a run missed
 * on the first is not caught up later — the summary is of a month, read when the next begins.
 */
export function summaryMonthDue(now: number, timeZone: string): Month | null {
  const today = localDate(now, timeZone);
  if (!today.endsWith('-01') || localMinutes(now, timeZone) < SUMMARY_TIME) return null;
  return monthShifted(monthOf(today), -1);
}
