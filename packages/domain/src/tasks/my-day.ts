import type { CalendarDate } from '../format/holidays';
import {
  calendarDayAfter,
  localDate,
  localInstant,
  localMinutes,
  MS_PER_DAY,
} from '../format/zone';

/**
 * My Day's bands (`M07-01`, `M07-02`): a list of what to do, ordered by urgency, never a chart.
 * The caller holds the tenant's clock (`F1-10`) and hands in the three instants that cut the day;
 * this file never reads a clock.
 */
export interface MyDayClock {
  /** Epoch milliseconds — the moment My Day is read. */
  readonly now: number;
  /** The start of tomorrow on the tenant's clock: today's band ends here. */
  readonly todayEnds: number;
  /** Seven tenant-local days after today: "this week" is a rolling week, never a calendar one. */
  readonly weekEnds: number;
}

/** The fixed order of the bands (`M07-02`): overdue first, always; this week closes the screen. */
export const MY_DAY_BANDS = ['overdue', 'today', 'week'] as const;
export type MyDayBand = (typeof MY_DAY_BANDS)[number];

/** Which band an open task's due moment falls in, or none once it is beyond the week. */
export function myDayBandOf(dueAt: number, clock: MyDayClock): MyDayBand | null {
  if (dueAt < clock.now) return 'overdue';
  if (dueAt < clock.todayEnds) return 'today';
  if (dueAt < clock.weekEnds) return 'week';
  return null;
}

/**
 * How many tasks My Day carries at most — far past a working week's list, so a backlog shows its
 * oldest and is counted in full, never dropped silently.
 */
export const MY_DAY_ITEMS_MAX = 200;

/** What the next-up rule reads off an open task. */
export interface NextUpCandidate {
  readonly id: string;
  /** Epoch milliseconds. */
  readonly dueAt: number;
}

/**
 * The one thing to do now (`M07-01`, "who do I call next"): the open task due earliest among those
 * due before today ends — the most overdue first, then today's by time. Nothing due today or
 * before → none; the week is not "now". Ties fall to the id, so web and phone agree.
 */
export function nextUpOf<Task extends NextUpCandidate>(
  tasks: readonly Task[],
  clock: MyDayClock,
): Task | null {
  let next: Task | null = null;
  for (const task of tasks) {
    if (task.dueAt >= clock.todayEnds) continue;
    if (
      next === null ||
      task.dueAt < next.dueAt ||
      (task.dueAt === next.dueAt && task.id < next.id)
    ) {
      next = task;
    }
  }
  return next;
}

/**
 * *Move to tomorrow* (`M07-05`): the same clock time on the day after today, both on the tenant's
 * clock — a 4 pm follow-up three days late lands at 4 pm tomorrow, never "now + 24 h".
 */
export function movedToTomorrow(dueAt: number, now: number, timeZone: string): number {
  const tomorrow = calendarDayAfter(localDate(now, timeZone), 1);
  return localInstant(tomorrow, localMinutes(dueAt, timeZone), timeZone);
}

/** "This week" is the seven tenant-local days after today (`M07-02`): it ends as day eight begins. */
const WEEK_ENDS_AFTER_DAYS = 8;

/** My Day's day on the company's clock (`F1-10`): today, when it began, and where its bands end. */
export interface MyDayDay extends MyDayClock {
  readonly today: CalendarDate;
  readonly todayBegan: number;
}

export function myDayDayOf(now: number, timeZone: string): MyDayDay {
  const today = localDate(now, timeZone);
  return {
    today,
    now,
    todayBegan: localInstant(today, 0, timeZone),
    todayEnds: localInstant(calendarDayAfter(today, 1), 0, timeZone),
    weekEnds: localInstant(calendarDayAfter(today, WEEK_ENDS_AFTER_DAYS), 0, timeZone),
  };
}

/**
 * How many tenant-local days late an overdue task is (`M07-02`: "a follow-up three days late"):
 * today's date less the due date, so a task due at 9 am and read at 5 pm the same day is 0 days
 * late — late today, not a day late.
 */
export function daysLateOf(dueAt: number, now: number, timeZone: string): number {
  const dayOf = (instant: number) => {
    const [year = 0, month = 1, day = 1] = localDate(instant, timeZone).split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.max(0, Math.round((dayOf(now) - dayOf(dueAt)) / MS_PER_DAY));
}
