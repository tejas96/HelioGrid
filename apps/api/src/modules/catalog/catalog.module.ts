import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.public';
import { MarketModule } from '../market/market.public';
import { CatalogAdminRepository } from './catalog.admin.repository';
import { CatalogController } from './catalog.controller';
import { CatalogImportActivityRegistration } from './catalog.import.activities';
import { CatalogImportController } from './catalog.import.controller';
import { CatalogImportRepository } from './catalog.import.repository';
import { CatalogImportService } from './catalog.import.service';
import { CatalogImportPreviewService } from './catalog.import-preview.service';
import { CatalogImportRowsRepository } from './catalog.import-rows.repository';
import { CatalogPlatformService } from './catalog.platform.service';
import { CatalogPriceBookController } from './catalog.price-book.controller';
import { CatalogPriceBookRepository } from './catalog.price-book.repository';
import { CatalogPriceBookService } from './catalog.price-book.service';
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
 * SKUs, overrides, rate ledger and labelled releases behind the catalog routes; and the price book
 * (`T-M01-031`), the rates panel of the same surface; and the spreadsheet import (`T-M01-030`),
 * whose steps run here beside the tables they write.
 */
@Module({
  imports: [MarketModule, FileModule],
  controllers: [
    CatalogController,
    CatalogReleasesController,
    CatalogPriceBookController,
    CatalogImportController,
  ],
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
    CatalogPriceBookService,
    CatalogPriceBookRepository,
    CatalogImportService,
    CatalogImportRepository,
    CatalogImportPreviewService,
    CatalogImportRowsRepository,
    CatalogImportActivityRegistration,
  ],
  exports: [CatalogPlatformService],
})
export class CatalogModule {}
