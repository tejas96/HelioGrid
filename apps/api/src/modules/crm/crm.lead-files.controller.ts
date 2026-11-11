import { leadFilesContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmLeadFilesService } from './crm.lead-files.service';
import { readerOf } from './internal/reader';

/**
 * A lead's files (`M02-32`): every member reads them on a lead in their scope; putting one on the
 * lead is the add-and-edit grant's, a record edit in the billing matrix — storing the bytes is the
 * files module's own upload row.
 */
@Controller()
export class CrmLeadFilesController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmLeadFilesService) private readonly files: CrmLeadFilesService) {}

  @TsRestHandler(leadFilesContract)
  @RouteBillingMap(leadFilesContract, { attach: 'create_edit_records' })
  @RouteAccessMap(leadFilesContract, {
    list: 'member',
    attach: { capability: 'crm.add_edit_leads' },
  })
  handler(@Req() req: Request) {
    return tsRestHandler(leadFilesContract, {
      list: async ({ params }) => ({
        status: 200,
        body: await this.files.list(readerOf(req), params.id),
      }),
      attach: async ({ params, body }) => ({
        status: 200,
        body: await this.files.attach(readerOf(req), params.id, body, actOf(req)),
      }),
    });
  }
}
