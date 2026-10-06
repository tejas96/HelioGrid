import { catalogReleasesContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { actOf, rolesOf, tenantIdOf } from '../../common/auth/session-context';
import { CatalogReleasesService } from './catalog.releases.service';

const MANAGE = { capability: 'onboarding.manage_catalog' } as const;

@Controller()
export class CatalogReleasesController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CatalogReleasesService) private readonly releases: CatalogReleasesService) {}

  @TsRestHandler(catalogReleasesContract)
  // Every door is the manage grant's (§M01.4): Finance's limited cell passes it to read the
  // prices a line carries, and the service refuses its publish (c6).
  @RouteAccessMap(catalogReleasesContract, { releases: MANAGE, release: MANAGE, publish: MANAGE })
  handler(@Req() req: Request) {
    const tenantId = () => tenantIdOf(req);
    return tsRestHandler(catalogReleasesContract, {
      releases: async ({ query }) => ({
        status: 200,
        body: await this.releases.releases(tenantId(), query),
      }),
      release: async ({ params, query }) => ({
        status: 200,
        body: await this.releases.release(tenantId(), params.id, query, Date.now()),
      }),
      publish: async ({ body, headers }) => ({
        status: 201,
        body: await this.releases.publish(tenantId(), rolesOf(req), body, headers, actOf(req)),
      }),
    });
  }
}
