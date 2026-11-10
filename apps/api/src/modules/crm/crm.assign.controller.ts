import { leadAssignContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, tenantIdOf } from '../../common/auth/session-context';
import { CrmAssignService } from './crm.assign.service';
import { actorNameOf, readerOf } from './internal/reader';

const ASSIGN = { capability: 'crm.assign_leads' } as const;

/**
 * Assignment (`M02-27`…`M02-31`): the assign grant's — the picker's loads included, since only an
 * assigner opens it. Giving a lead away is a record edit, paused for a halted company.
 */
@Controller()
export class CrmAssignController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmAssignService) private readonly assigns: CrmAssignService) {}

  @TsRestHandler(leadAssignContract)
  @RouteBillingMap(leadAssignContract, {
    assign: 'create_edit_records',
    bulkAssign: 'create_edit_records',
  })
  @RouteAccessMap(leadAssignContract, { assignees: ASSIGN, assign: ASSIGN, bulkAssign: ASSIGN })
  handler(@Req() req: Request) {
    return tsRestHandler(leadAssignContract, {
      assignees: async () => ({
        status: 200,
        body: await this.assigns.assignees(tenantIdOf(req), Date.now()),
      }),
      assign: async ({ params, body }) => ({
        status: 200,
        body: await this.assigns.assign(
          readerOf(req),
          actorNameOf(req),
          params.id,
          body,
          actOf(req),
        ),
      }),
      bulkAssign: async ({ body }) => ({
        status: 200,
        body: await this.assigns.bulkAssign(readerOf(req), actorNameOf(req), body, actOf(req)),
      }),
    });
  }
}
