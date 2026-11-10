import { activitiesContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { CrmActivitiesService } from './crm.activities.service';
import { readerOf } from './internal/reader';

/** The timeline (`M02-35`): every member reads it through their lead scope; never gated. */
@Controller()
export class CrmActivitiesController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CrmActivitiesService) private readonly activities: CrmActivitiesService) {}

  @TsRestHandler(activitiesContract)
  @RouteAccessMap(activitiesContract, { leadTimeline: 'member', customerTimeline: 'member' })
  handler(@Req() req: Request) {
    return tsRestHandler(activitiesContract, {
      leadTimeline: async ({ params, query }) => ({
        status: 200,
        body: await this.activities.leadTimeline(readerOf(req), params.id, query),
      }),
      customerTimeline: async ({ params, query }) => ({
        status: 200,
        body: await this.activities.customerTimeline(readerOf(req), params.id, query),
      }),
    });
  }
}
