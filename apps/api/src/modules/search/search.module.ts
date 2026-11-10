import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.public';
import { SettingsModule } from '../settings/settings.public';
import { SearchController } from './search.controller';
import { SearchRepository } from './search.repository';
import { SearchService } from './search.service';

/**
 * The global search (`T-FPLAT-020`): one read over the CRM's records, the team and the catalog.
 * It reads each through that module's public surface — the CRM's scope predicate, the catalog's
 * list — and owns no table.
 */
@Module({
  imports: [SettingsModule, CatalogModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
})
export class SearchModule {}
