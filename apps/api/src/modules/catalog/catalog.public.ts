import indiaPlatformItems from './internal/in-platform-items.json';

/**
 * The catalog module's export surface (apps/api/CLAUDE.md): the module, the publish service the
 * command drives, and the first India list it publishes — the POC's panels, inverters and
 * batteries, each labelled `representative`, available in `IN`, with its DCR row and no price
 * (the owner's ruling at `T-M01-037`'s start). Data, parsed at the door by the service.
 */
export type { PlatformPublishOutcome } from './catalog.admin.repository';
export { CatalogModule } from './catalog.module';
export { CatalogPlatformService } from './catalog.platform.service';

export const IN_PLATFORM_ITEMS: readonly unknown[] = indiaPlatformItems;
