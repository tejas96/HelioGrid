import { leadImportContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, tenantIdOf } from '../../common/auth/session-context';
import { CrmLeadImportService } from './crm.lead-import.service';
import { CrmLeadImportPreviewService } from './crm.lead-import-preview.service';
import { CrmLeadImportRunService } from './crm.lead-import-run.service';
import { readerOf } from './internal/reader';

const IMPORT = { capability: 'crm.import_leads' } as const;

/**
 * The lead import (`SCR-M02-05`): every door is `crm.import_leads` — the Owner's and the Sales
 * Manager's (`F2.M02.import-leads`). Starting, mapping and running make leads, so a halted company is
 * paused from them (`create_edit_records`); its jobs and their reports still read.
 */
@Controller()
export class CrmLeadImportController {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CrmLeadImportService) private readonly imports: CrmLeadImportService,
    @Inject(CrmLeadImportPreviewService) private readonly previews: CrmLeadImportPreviewService,
    @Inject(CrmLeadImportRunService) private readonly runs: CrmLeadImportRunService,
  ) {}

  @TsRestHandler(leadImportContract)
  @RouteBillingMap(leadImportContract, {
    start: 'create_edit_records',
    map: 'create_edit_records',
    run: 'create_edit_records',
  })
  @RouteAccessMap(leadImportContract, {
    start: IMPORT,
    import: IMPORT,
    map: IMPORT,
    rows: IMPORT,
    run: IMPORT,
  })
  handler(@Req() req: Request) {
    return tsRestHandler(leadImportContract, {
      start: async ({ body, headers }) => ({
        status: 201,
        body: await this.imports.start(tenantIdOf(req), body, headers, actOf(req)),
      }),
      import: async ({ params }) => ({
        status: 200,
        body: await this.imports.import(tenantIdOf(req), params.id),
      }),
      map: async ({ params, body }) => ({
        status: 200,
        body: await this.imports.map(tenantIdOf(req), params.id, body, actOf(req).now),
      }),
      rows: async ({ params, query }) => ({
        status: 200,
        body: await this.previews.page(readerOf(req), params.id, query),
      }),
      run: async ({ params, body }) => ({
        status: 200,
        body: await this.runs.run(tenantIdOf(req), params.id, body, actOf(req)),
      }),
    });
  }
}
