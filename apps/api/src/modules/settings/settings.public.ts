/**
 * The settings module's export surface (apps/api/CLAUDE.md §Local conventions): the module, and
 * the seed the tenant-creation transaction runs so a company is never observed without its
 * defaults (`M01-28`, `M01-54`).
 */
export { seedTenantSettings } from './settings.admin.repository';
export { SettingsModule } from './settings.module';
