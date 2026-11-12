import { type ClockTime, clockTime, clockTimeOfMinutes } from '../calling/clock-time';
import {
  type CallingRulesPack,
  type CallingWindow,
  type MessagingWindow,
  NO_WINDOW,
} from '../calling/pack';
import { lawfulSendTime, windowInForce } from '../calling/window';
import type { CalendarDate } from '../format/holidays';
import { localDate, localMinutes, MS_PER_DAY, nextLocalTime } from '../format/zone';

/**
 * The CRM's timers, on the tenant's clock (`F1-10`). This package has no clock: every instant
 * arrives as epoch milliseconds and every zone as its IANA name, and `format/zone` is the one
 * reader of a wall clock.
 */

/** Every wake-up lands at 09:00 on the tenant's timezone (`M02-49`) — a product rule, not a market's. */
export const CRM_WAKE_TIME: ClockTime = clockTime('09:00');

/** Thirty days with no activity on an open stage flags a lead dormant (`M02-52`). */
export const DORMANT_AFTER_DAYS = 30;

/** More than twenty-four hours unassigned escalates to the owner (`M02-50`). */
export const UNASSIGNED_ESCALATES_AFTER_MS = MS_PER_DAY;

/** A loss for *not interested* raises no call task for six months (`M02-54`). */
export const NO_CALL_MONTHS = 6;

/**
 * The instant 09:00 falls on `date` in `timeZone`. Begun twelve hours before that date's UTC
 * midnight, every zone from UTC−12 to UTC+14 reads between the day before and 02:00 on the date, so
 * the first 09:00 after it is the date's or the day before's — and the one after that the date's.
 */
export function wakeInstantOf(date: CalendarDate, timeZone: string): number {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const begun = Date.UTC(year, month - 1, day) - MS_PER_DAY / 2;
  const first = nextLocalTime(begun, CRM_WAKE_TIME, timeZone);
  return localDate(first, timeZone) === date
    ? first
    : nextLocalTime(first, CRM_WAKE_TIME, timeZone);
}

/**
 * Whether a tenant's daily sweep runs now (`M02-49`): once per local day, at or after 09:00 on its
 * own clock. A run already recorded for today's local date means not again until tomorrow.
 */
export function dailySweepDue(
  nowEpoch: number,
  timeZone: string,
  lastRunLocalDate: CalendarDate | null,
): boolean {
  if (localMinutes(nowEpoch, timeZone) < CRM_WAKE_TIME) return false;
  return lastRunLocalDate === null || lastRunLocalDate < localDate(nowEpoch, timeZone);
}

/** Whether thirty days have passed since the lead's last activity (`M02-52`). */
export function isDormantDue(lastActivityEpoch: number, nowEpoch: number): boolean {
  return nowEpoch - lastActivityEpoch >= DORMANT_AFTER_DAYS * MS_PER_DAY;
}

/** Whether a lead has waited unassigned for MORE than twenty-four hours (`M02-50`). */
export function isUnassignedOverdue(createdEpoch: number, nowEpoch: number): boolean {
  return nowEpoch - createdEpoch > UNASSIGNED_ESCALATES_AFTER_MS;
}

/**
 * The window a call-back waits for (`M02-15`): the market's statutory calling floor (`F1-36`b),
 * narrowed by the tenant's own window where it keeps one and never widened (`F1-17`). A market that
 * declares no voice ruleset states no hour, so every hour is open.
 */
export function callBackWindowOf(
  rules: CallingRulesPack,
  tenant: CallingWindow | null,
): MessagingWindow {
  const statutory = rules.voice.declared ? rules.voice.promotionalWindow.value : NO_WINDOW;
  return windowInForce(statutory, tenant);
}

/**
 * When a call-back raised now falls due (`M02-15`): now, when the tenant's clock is inside the
 * window — a moment the window lets stand unchanged (`lawfulSendTime`) — else the window's next
 * opening. A capture at 21:40 is due at 09:00 the next morning, never earlier. Capture itself is
 * never held for the clock; only the call waits.
 */
export function callBackDueAt(nowEpoch: number, timeZone: string, window: MessagingWindow): number {
  if (window === NO_WINDOW) return nowEpoch;
  const now = clockTimeOfMinutes(localMinutes(nowEpoch, timeZone));
  const lawful = lawfulSendTime(window, now);
  if (lawful.day === 'same' && lawful.at === now) return nowEpoch;
  return nextLocalTime(nowEpoch, window.opens, timeZone);
}

/**
 * The same day `months` calendar months after `date`. A month shorter than the start day lands on
 * its last day: 31 August plus six months is 28 or 29 February.
 */
export function calendarMonthsAfter(date: CalendarDate, months: number): CalendarDate {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const monthIndex = month - 1 + months;
  const endYear = year + Math.floor(monthIndex / 12);
  const endMonth = monthIndex % 12;
  const daysInEndMonth =
    (Date.UTC(endYear, endMonth + 1, 1) - Date.UTC(endYear, endMonth, 1)) / MS_PER_DAY;
  const endDay = Math.min(day, daysInEndMonth);
  return `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}

/** The last day of a six-month no-call spell starting `today` (`M02-54`). */
export function noCallUntilOf(today: CalendarDate): CalendarDate {
  return calendarMonthsAfter(today, NO_CALL_MONTHS);
}
