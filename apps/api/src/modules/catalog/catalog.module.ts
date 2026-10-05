import { Module } from '@nestjs/common';
import { MarketModule } from '../market/market.public';
import { CatalogAdminRepository } from './catalog.admin.repository';
import { CatalogPlatformService } from './catalog.platform.service';

/** The catalog (`T-M01-027`): part a lands the platform book's publish; the routes follow. */
@Module({
  imports: [MarketModule],
  providers: [CatalogPlatformService, CatalogAdminRepository],
  exports: [CatalogPlatformService],
})
export class CatalogModule {}
