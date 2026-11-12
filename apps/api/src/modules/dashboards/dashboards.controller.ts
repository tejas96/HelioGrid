import { dashboardsContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf } from '../../common/auth/session-context';
import { DashboardsService } from './dashboards.service';
import { COMPANY_REPORTS, dashboardReaderOf } from './internal/reader';

const REPORTS = { capability: COMPANY_REPORTS } as const;

/**
 * The owner dashboard (`F2.M13.company-reports`): the EPC Owner reads the company, a Sales Manager
 * the team; setting the target is the company-wide reader's alone, checked in the service. The
 * target is a setting, so no billing state pauses it, and the read works in every state.
 */
@Controller()
export class DashboardsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(DashboardsService) private readonly dashboards: DashboardsService) {}

  @TsRestHandler(dashboardsContract)
  @RouteBillingMap(dashboardsContract, { setTarget: 'ungated' })
  @RouteAccessMap(dashboardsContract, { owner: REPORTS, setTarget: REPORTS })
  handler(@Req() req: Request) {
    const reader = dashboardReaderOf(req);
    return tsRestHandler(dashboardsContract, {
      owner: async () => ({ status: 200, body: await this.dashboards.owner(reader, Date.now()) }),
      setTarget: async ({ body }) => ({
        status: 200,
        body: await this.dashboards.setTarget(reader, body, actOf(req)),
      }),
    });
  }
}
