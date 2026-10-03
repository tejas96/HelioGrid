import type { CalendarDate } from '../format/holidays';
import { localDate, MS_PER_DAY } from '../format/zone';
import { NOTIFICATION_REGISTRY } from './registry';
import { NOTIFICATION_TYPES, type NotificationType } from './types';

/**
 * What the centre reads of one notification. Named by shape here because `packages/contracts`
 * derives from this package and may not be imported by it; the wire's `Notification` satisfies it.
 * `type` is a string because the read side grows with every module (`extensibleEnum`).
 */
export interface CentreNotification {
  readonly id: string;
  readonly type: string;
  readonly emittedAt: string;
  readonly readAt: string | null;
  readonly groupKey: string | null;
}

/**
 * One row of the list (`F6-12`): an item on its own, or two or more items the server keyed alike.
 * A group is presentation only — every member is still its own record and its own link.
 */
export type CentreRow<T extends CentreNotification> =
  | { readonly kind: 'single'; readonly item: T }
  | {
      readonly kind: 'group';
      readonly key: string;
      /** Newest first, as the list arrived. */
      readonly members: readonly [T, T, ...T[]];
      readonly unread: number;
    };

/** One of the tenant's calendar days and the rows emitted on it, newest first. */
export interface CentreDay<T extends CentreNotification> {
  readonly date: CalendarDate;
  /** 0 is today and 1 yesterday, on the tenant's clock — what the day's label is chosen by. */
  readonly daysAgo: number;
  readonly rows: readonly CentreRow<T>[];
}

export interface CentreFacts {
  readonly now: number;
  /** The tenant's zone (`F1-10`): the same day `centreGroupKey` grouped on. */
  readonly timeZone: string;
  /** Whether the list can load an older page — the list's own answer, never re-derived here. */
  readonly hasMore: boolean;
}

export interface CentreView<T extends CentreNotification> {
  readonly days: readonly CentreDay<T>[];
  /**
   * Mark all read shows only while something unread is LISTED (`F4-27`): a control with nothing
   * to do removes itself rather than going grey.
   */
  readonly markAllShows: boolean;
  /**
   * The newest `emittedAt` the list shows — what mark all read sends, so an item that lands after
   * the render stays unread (`F6-07`). Null when nothing is listed.
   */
  readonly seenThrough: string | null;
  /** Older matches remain past what is loaded, so Show older offers them. */
  readonly olderRemain: boolean;
}

/**
 * The centre's list, decided once for both apps (`F6-12`, `F6-17`). The items arrive newest first
 * from the server; this collects equal `groupKey`s into one row at the newest member's place, and
 * never decides what groups — a null key, which an immediate type always carries, stands alone.
 */
export function centreView<T extends CentreNotification>(
  items: readonly T[],
  facts: CentreFacts,
): CentreView<T> {
  const today = localDate(facts.now, facts.timeZone);
  const days: { date: CalendarDate; daysAgo: number; rows: Gathered<T>[] }[] = [];
  const gatheredBy = new Map<string, Gathered<T>>();

  for (const item of items) {
    const sameKey = item.groupKey === null ? undefined : gatheredBy.get(item.groupKey);
    if (sameKey !== undefined) {
      sameKey.members.push(item);
      continue;
    }
    const gathered: Gathered<T> = { key: item.groupKey, members: [item] };
    if (item.groupKey !== null) gatheredBy.set(item.groupKey, gathered);
    const date = localDate(Date.parse(item.emittedAt), facts.timeZone);
    const lastDay = days.at(-1);
    if (lastDay?.date === date) lastDay.rows.push(gathered);
    else days.push({ date, daysAgo: daysBetween(date, today), rows: [gathered] });
  }

  return {
    days: days.map((day) => ({ ...day, rows: day.rows.map(asRow) })),
    markAllShows: items.some((item) => item.readAt === null),
    seenThrough: items[0]?.emittedAt ?? null,
    olderRemain: facts.hasMore,
  };
}

/** The items one key gathered, newest first; a null key gathers its own item alone. */
interface Gathered<T extends CentreNotification> {
  readonly key: string | null;
  readonly members: T[];
}

/** One gathered item is a row of its own: a group needs two (`F6-12`). */
function asRow<T extends CentreNotification>({ key, members }: Gathered<T>): CentreRow<T> {
  const [first, second, ...rest] = members;
  if (first === undefined) throw new Error('a gathering always holds the item that opened it');
  if (key === null || second === undefined) return { kind: 'single', item: first };
  return {
    kind: 'group',
    key,
    members: [first, second, ...rest],
    unread: members.filter((member) => member.readAt === null).length,
  };
}

/**
 * Whole calendar days from `from` back to `to`; both are `YYYY-MM-DD` on the same clock. Never
 * below 0: a device clock a minute behind the server would otherwise call today's item a past day.
 */
function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY));
}

/**
 * Product news (`F6.4`): what the platform says to a company, drawn apart so it never passes for
 * the company's own work. Read from what raises the type; a type this build does not know is
 * the company's work, never an announcement.
 */
export function isAnnouncement(type: string): boolean {
  return isKnownType(type) && NOTIFICATION_REGISTRY[type].raisedBy === 'platform';
}

function isKnownType(type: string): type is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(type);
}
