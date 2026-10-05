import { CatalogAdminRepository } from '../../src/modules/catalog/catalog.admin.repository';
import { CatalogPlatformService } from '../../src/modules/catalog/catalog.platform.service';
import type { openPools } from '../support/fixture';
import { marketsOf } from '../support/market';

type Pools = ReturnType<typeof openPools>;

/** The publish service as `catalog.module.ts` composes it, over the real admin repository and the real pack read. */
export function catalogPlatformServiceOf(pools: Pools): CatalogPlatformService {
  return new CatalogPlatformService(new CatalogAdminRepository(pools.admin.db), marketsOf(pools));
}
