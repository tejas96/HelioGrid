import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.public';
import { CatalogAdminRepository } from './catalog.admin.repository';
import { CatalogController } from './catalog.controller';
import { CatalogPlatformService } from './catalog.platform.service';
import { CatalogPricesRepository } from './catalog.prices.repository';
import { CatalogRatesRepository } from './catalog.rates.repository';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';
import { CatalogSliceRepository } from './catalog.slice.repository';

/**
 * The catalog (`T-M01-027`): the platform book's publish, and the tenant's market slice, own
 * SKUs, overrides and rate ledger behind the catalog routes. The releases follow (part c).
 */
@Module({
  imports: [MarketModule],
  controllers: [CatalogController],
  providers: [
    CatalogPlatformService,
    CatalogAdminRepository,
    CatalogService,
    CatalogSliceRepository,
    CatalogRepository,
    CatalogPricesRepository,
    CatalogRatesRepository,
  ],
  exports: [CatalogPlatformService],
})
export class CatalogModule {}
