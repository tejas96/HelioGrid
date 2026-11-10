import { leadCallsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { CrmCallsService } from './crm.calls.service';
import { readerOf } from './internal/reader';

const ADD_EDIT = { capability: 'crm.add_edit_leads' } as const;

/** Log activity on a lead (`SCR-M02-04`): the add-and-edit grant's, each a record in the matrix. */
@Controller()
export class CrmCallsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmCallsService) private readonly calls: CrmCallsService) {}

  @TsRestHandler(leadCallsContract)
  @RouteBillingMap(leadCallsContract, {
    logCall: 'create_edit_records',
    addNote: 'create_edit_records',
  })
  @RouteAccessMap(leadCallsContract, { logCall: ADD_EDIT, addNote: ADD_EDIT })
  handler(@Req() req: Request) {
    return tsRestHandler(leadCallsContract, {
      logCall: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.calls.logCall(readerOf(req), params.id, body, headers, actOf(req)),
      }),
      addNote: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.calls.addNote(readerOf(req), params.id, body, headers, actOf(req)),
      }),
    });
  }
}
