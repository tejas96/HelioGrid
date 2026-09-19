/**
 * The notification module's export surface (apps/api/CLAUDE.md §Local conventions): the module,
 * the ONE writer every other repository calls with its own transaction — so the record and the
 * change that earned it commit together (`F6-06`) and no module ever keeps a second inbox
 * (`F6-01`) — and the sender that carries its push.
 *
 * The two are called at different moments on purpose. `recordNotification` runs INSIDE the
 * emitting transaction; `NotificationPushService.deliver` runs after it commits, because a push
 * sent for a row that then rolled back cannot be recalled.
 */
export { NotificationModule } from './notification.module';
export { NotificationPushService } from './notification.push.service';
export { type NotificationToWrite, recordNotification } from './notification.repository';
