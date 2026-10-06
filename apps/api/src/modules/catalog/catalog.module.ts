import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.public';
import { CatalogAdminRepository } from './catalog.admin.repository';
import { CatalogController } from './catalog.controller';
import { CatalogPlatformService } from './catalog.platform.service';
import { CatalogPricesRepository } from './catalog.prices.repository';
import { CatalogRatesRepository } from './catalog.rates.repository';
import { CatalogReleaseReadsRepository } from './catalog.release-reads.repository';
import { CatalogReleasesController } from './catalog.releases.controller';
import { CatalogReleasesRepository } from './catalog.releases.repository';
import { CatalogReleasesService } from './catalog.releases.service';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';
import { CatalogSliceRepository } from './catalog.slice.repository';

/**
 * The catalog (`T-M01-027`): the platform book's publish, and the tenant's market slice, own
 * SKUs, overrides, rate ledger and labelled releases behind the catalog routes.
 */
@Module({
  imports: [MarketModule],
  controllers: [CatalogController, CatalogReleasesController],
  providers: [
    CatalogPlatformService,
    CatalogAdminRepository,
    CatalogService,
    CatalogSliceRepository,
    CatalogRepository,
    CatalogPricesRepository,
    CatalogRatesRepository,
    CatalogReleasesService,
    CatalogReleasesRepository,
    CatalogReleaseReadsRepository,
  ],
  exports: [CatalogPlatformService],
})
export class CatalogModule {}
