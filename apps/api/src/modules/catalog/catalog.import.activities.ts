import {
  type CatalogImportActivities,
  catalogImportWorkflow,
} from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { CatalogImportService } from './catalog.import.service';
import { CatalogImportPreviewService } from './catalog.import-preview.service';

/**
 * The import's steps, registered with the step host: they run here, beside the catalog's tables
 * and the stored file, and the worker's `catalogImport` workflow calls them on `heliogrid-catalog`.
 */
@Injectable()
export class CatalogImportActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(CatalogImportService) private readonly imports: CatalogImportService,
    @Inject(CatalogImportPreviewService) private readonly previews: CatalogImportPreviewService,
  ) {}

  onModuleInit(): void {
    const activities: CatalogImportActivities = {
      readCatalogImport: (input) => this.imports.readFile(input, Date.now()),
      endCatalogImportRead: (input) => this.imports.endRead(input, Date.now()),
      matchCatalogImport: (input) => this.previews.matchRows(input, Date.now()),
      endCatalogImportMatch: (input) => this.previews.endMatch(input, Date.now()),
    };
    this.host.register({ taskQueue: catalogImportWorkflow.taskQueue, activities });
  }
}
