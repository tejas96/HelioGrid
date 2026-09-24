import { localDate, MS_PER_DAY } from '../format/zone';
import type { SubjectKind } from '../subject/kinds';
import { NOTIFICATION_REGISTRY, typeGroupOf } from './registry';
import { NOTIFICATION_TYPES, type NotificationType, type NotificationTypeGroup } from './types';

/**
 * How many days back the notification centre reads (`F6-19`) — the owner's number, and the one
 * `SCR-SHELL-03` states at its horizon. It bounds every centre READ: the list, its count and the
 * badge, so the three always agree. Nothing is deleted by it; a row past it is simply unseen.
 */
export const NOTIFICATION_CENTRE_HORIZON_DAYS = 30;

/** The oldest instant the centre still reads, for a reader asking at `now`. */
export function centreHorizonStart(now: number): number {
  return now - NOTIFICATION_CENTRE_HORIZON_DAYS * MS_PER_DAY;
}

/**
 * The types a type-group filter admits (`F6-17`). Read through `typeGroupOf`, so a group is never
 * a second list of types that could drift from what raises them.
 */
export function typesInGroups(groups: readonly NotificationTypeGroup[]): NotificationType[] {
  return NOTIFICATION_TYPES.filter((type) => groups.includes(typeGroupOf(type)));
}

/**
 * Which items the centre draws as one group (`F6-12`): the same type, on the same subject kind,
 * on the same TENANT calendar day (`F1-10`) — "3 proposals opened today". Equal keys group.
 *
 * An immediate type answers null and never groups, because grouping it would hide the one thing
 * the class exists to surface (`F6-13`). Grouping is presentation only: every record still stands
 * on its own, and the key is how the screen knows which to draw together without deciding it.
 */
export function centreGroupKey(
  type: NotificationType,
  subjectKind: SubjectKind,
  emittedAt: number,
  timeZone: string,
): string | null {
  if (NOTIFICATION_REGISTRY[type].urgency === 'immediate') return null;
  return `${type}:${subjectKind}:${localDate(emittedAt, timeZone)}`;
}
