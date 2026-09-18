/**
 * The notification module's export surface (apps/api/CLAUDE.md §Local conventions): the module,
 * and the ONE writer every other repository calls with its own transaction — so the record and
 * the change that earned it commit together (`F6-06`) and no module ever keeps a second inbox
 * (`F6-01`).
 */
export { NotificationModule } from './notification.module';
export { type NotificationToWrite, recordNotification } from './notification.repository';
