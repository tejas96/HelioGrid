import { leadEditsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmEditsService } from './crm.edits.service';
import { readerOf } from './internal/reader';

/** Lead edits (`M02-36`): the add-and-edit grant's, a record edit in the billing matrix. */
@Controller()
export class CrmEditsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmEditsService) private readonly edits: CrmEditsService) {}

  @TsRestHandler(leadEditsContract)
  @RouteBillingMap(leadEditsContract, { edit: 'create_edit_records' })
  @RouteAccessMap(leadEditsContract, { edit: { capability: 'crm.add_edit_leads' } })
  handler(@Req() req: Request) {
    return tsRestHandler(leadEditsContract, {
      edit: async ({ params, body }) => ({
        status: 200,
        body: await this.edits.edit(readerOf(req), params.id, body, actOf(req)),
      }),
    });
  }
}
