import { clockTime } from '../calling/clock-time';
import type { CalendarDate } from '../format/holidays';
import { localDate, localInstant, MS_PER_DAY } from '../format/zone';
import { calendarMonthsAfter } from './crm-clock';

/**
 * The days a postponed loss can come back on, offered as one tap each (`M02-54`): a week, a month
 * and three months from today. A month shorter than today's day lands on its last day.
 */
export interface LeadPostponeDays {
  readonly week: CalendarDate;
  readonly month: CalendarDate;
  readonly threeMonths: CalendarDate;
}

/**
 * The days and moments Lead Detail's acts name, on the tenant's clock (`F1-10`): a visit or a
 * call-back is booked for today or later, a snooze wakes tomorrow at the earliest (`M02-51`), and a
 * postponed loss comes back on a day after today (`M02-54`).
 */
export interface LeadActDays {
  readonly today: CalendarDate;
  readonly tomorrow: CalendarDate;
  readonly postpone: LeadPostponeDays;
}

export function leadActDaysOf(nowEpoch: number, timeZone: string): LeadActDays {
  const today = localDate(nowEpoch, timeZone);
  return {
    today,
    tomorrow: localDate(nowEpoch + MS_PER_DAY, timeZone),
    postpone: {
      week: localDate(nowEpoch + 7 * MS_PER_DAY, timeZone),
      month: calendarMonthsAfter(today, 1),
      threeMonths: calendarMonthsAfter(today, 3),
    },
  };
}

/** The instant a day and an `HH:MM` time stand at on the tenant's clock — a call-back's due moment. */
export function tenantInstantOf(date: CalendarDate, time: string, timeZone: string): number {
  return localInstant(date, clockTime(time), timeZone);
}
