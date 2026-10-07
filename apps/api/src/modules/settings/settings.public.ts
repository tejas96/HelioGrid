/**
 * The settings module's export surface (apps/api/CLAUDE.md §Local conventions): the module, the
 * seed the tenant-creation transaction runs so a company is never observed without its defaults
 * (`M01-28`, `M01-54`), and the service whose `quietHoursOf` holds a notification's push
 * (`F6-14`).
 */
export { seedTenantSettings } from './settings.admin.repository';
export { SettingsModule } from './settings.module';
export { SettingsService } from './settings.service';
