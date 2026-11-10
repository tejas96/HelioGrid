import { clockTime } from '../calling/clock-time';
import type { CalendarDate } from '../format/holidays';
import { localDate, localInstant, MS_PER_DAY } from '../format/zone';

/**
 * The days and moments Lead Detail's acts name, on the tenant's clock (`F1-10`): a visit or a
 * call-back is booked for today or later, a snooze wakes tomorrow at the earliest (`M02-51`).
 */
export interface LeadActDays {
  readonly today: CalendarDate;
  readonly tomorrow: CalendarDate;
}

export function leadActDaysOf(nowEpoch: number, timeZone: string): LeadActDays {
  return {
    today: localDate(nowEpoch, timeZone),
    tomorrow: localDate(nowEpoch + MS_PER_DAY, timeZone),
  };
}

/** The instant a day and an `HH:MM` time stand at on the tenant's clock — a call-back's due moment. */
export function tenantInstantOf(date: CalendarDate, time: string, timeZone: string): number {
  return localInstant(date, clockTime(time), timeZone);
}
