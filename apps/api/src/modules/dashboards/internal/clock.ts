import {
  type Month,
  monthShifted,
  monthSpan as monthSpanOf,
  winRateWindowStart,
} from '@heliogrid/domain';

/*
 * The owner dashboard's periods as the database reads them: the domain's company-clock instants
 * (`F1-10`) as the `Date`s a timestamp comparison takes. The rules themselves are the domain's.
 */
export {
  firstDayOf,
  type Month,
  monthOf,
  SUMMARY_TIME,
  summaryMonthDue,
} from '@heliogrid/domain';

/** The month before `month`. */
export const monthBefore = (month: Month): Month => monthShifted(month, -1);

/** The month after `month`. */
export const monthAfter = (month: Month): Month => monthShifted(month, 1);

/** The instants the month starts and the next one starts, as `Date`s. */
export function monthSpan(month: Month, timeZone: string): { from: Date; to: Date } {
  const span = monthSpanOf(month, timeZone);
  return { from: new Date(span.from), to: new Date(span.to) };
}

/** The win-rate window's start, as a `Date`. */
export function windowStartOf(now: number, timeZone: string): Date {
  return new Date(winRateWindowStart(now, timeZone));
}
