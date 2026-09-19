/**
 * The notification type registry (`F6-05`): what the product can tell someone, who receives it,
 * where it is delivered and how soon. The RECORD those types are written into is `packages/db`'s;
 * the words they carry are `packages/i18n`'s, authored by the slice that first raises each type.
 */

export { channelsOwed, mayMute, pushMuted } from './mutes';
export { marketQuietHours, pushDueAt, type QuietWindow } from './quiet-hours';
export type { NotificationRegistration } from './registry';
export { NOTIFICATION_REGISTRY, typeGroupOf } from './registry';
export type {
  NotificationChannel,
  NotificationRecipientRule,
  NotificationSource,
  NotificationType,
  NotificationTypeGroup,
  NotificationUrgency,
} from './types';
export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_RECIPIENT_RULES,
  NOTIFICATION_SOURCES,
  NOTIFICATION_TYPE_GROUPS,
  NOTIFICATION_TYPES,
  NOTIFICATION_URGENCIES,
} from './types';
