import { type LeadImportActivities, leadImportWorkflow } from '@heliogrid/contracts/workflows';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { TemporalActivityHost } from '../../common/temporal/temporal.activity-host';
import { CrmLeadImportService } from './crm.lead-import.service';
import { CrmLeadImportPreviewService } from './crm.lead-import-preview.service';
import { CrmLeadImportRunService } from './crm.lead-import-run.service';

/**
 * The lead import's steps, registered with the step host: they run here, beside the CRM's tables
 * and the stored file, and the worker's `leadImport` workflow calls them on `heliogrid-crm` — the
 * queue the CRM's other workflows share, each registering its own steps on it.
 */
@Injectable()
export class CrmLeadImportActivityRegistration implements OnModuleInit {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(TemporalActivityHost) private readonly host: TemporalActivityHost,
    @Inject(CrmLeadImportService) private readonly imports: CrmLeadImportService,
    @Inject(CrmLeadImportPreviewService) private readonly previews: CrmLeadImportPreviewService,
    @Inject(CrmLeadImportRunService) private readonly runs: CrmLeadImportRunService,
  ) {}

  onModuleInit(): void {
    const activities: LeadImportActivities = {
      readLeadImport: (input) => this.imports.readFile(input, Date.now()),
      endLeadImportRead: (input) => this.imports.endRead(input, Date.now()),
      matchLeadImport: (input) => this.previews.matchRows(input, Date.now()),
      endLeadImportMatch: (input) => this.previews.endMatch(input, Date.now()),
      applyLeadImportRows: (input) => this.runs.applyRows(input, Date.now()),
      endLeadImportRun: (input) => this.runs.endRun(input, Date.now()),
    };
    this.host.register({ taskQueue: leadImportWorkflow.taskQueue, activities });
  }
}
