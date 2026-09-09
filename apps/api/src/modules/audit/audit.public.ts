/**
 * The audit module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and the
 * ONE writer every other repository calls with its own transaction, so an entry is written with
 * the change that caused it (`F2-22`) and no module ever keeps a second log.
 */
export { AuditModule } from './audit.module';
export { type AuditEntryToWrite, recordAuditEntry } from './audit.repository';
