import { priceBookContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { actOf, rolesOf, tenantIdOf } from '../../common/auth/session-context';
import { CatalogPriceBookService } from './catalog.price-book.service';
import { MANAGE_CATALOG } from './internal/write-checks';

const MANAGE = { capability: MANAGE_CATALOG } as const;

@Controller()
export class CatalogPriceBookController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CatalogPriceBookService) private readonly book: CatalogPriceBookService) {}

  @TsRestHandler(priceBookContract)
  // Every door is the manage grant's (§M01.5): a rate and a margin are money, so Finance's limited
  // cell passes it to read, and the service refuses its publish.
  @RouteAccessMap(priceBookContract, {
    active: MANAGE,
    versions: MANAGE,
    version: MANAGE,
    publish: MANAGE,
  })
  handler(@Req() req: Request) {
    const tenantId = () => tenantIdOf(req);
    return tsRestHandler(priceBookContract, {
      active: async () => ({
        status: 200,
        body: await this.book.active(tenantId(), Date.now()),
      }),
      versions: async ({ query }) => ({
        status: 200,
        body: await this.book.versions(tenantId(), query),
      }),
      version: async ({ params }) => ({
        status: 200,
        body: await this.book.version(tenantId(), params.id, Date.now()),
      }),
      publish: async ({ body, headers }) => ({
        status: 201,
        body: await this.book.publish(tenantId(), rolesOf(req), body, headers, actOf(req)),
      }),
    });
  }
}
