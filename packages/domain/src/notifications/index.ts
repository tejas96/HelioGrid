/**
 * The notification type registry (`F6-05`): what the product can tell someone, who receives it,
 * where it is delivered and how soon. The RECORD those types are written into is `packages/db`'s;
 * the words they carry are `packages/i18n`'s, authored by the slice that first raises each type.
 */

export {
  centreGroupKey,
  centreHorizonStart,
  NOTIFICATION_CENTRE_HORIZON_DAYS,
  typesInGroups,
} from './centre';
export { pushIsDue } from './delivery';
export { channelsOwed, mayMute, pushMuted } from './mutes';
export { marketQuietHours, pushDueAt, type QuietWindow } from './quiet-hours';
export type { NotificationRegistration } from './registry';
export { NOTIFICATION_REGISTRY, typeGroupOf } from './registry';
export type {
  NotificationChannel,
  NotificationReadFilter,
  NotificationRecipientRule,
  NotificationSource,
  NotificationType,
  NotificationTypeGroup,
  NotificationUrgency,
  PushPlatform,
} from './types';
export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_READ_FILTERS,
  NOTIFICATION_RECIPIENT_RULES,
  NOTIFICATION_SOURCES,
  NOTIFICATION_TYPE_GROUPS,
  NOTIFICATION_TYPES,
  NOTIFICATION_URGENCIES,
  PUSH_PLATFORMS,
} from './types';
