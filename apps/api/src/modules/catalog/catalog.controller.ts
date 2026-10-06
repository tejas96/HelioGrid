import { catalogContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { actOf, rolesOf, tenantIdOf } from '../../common/auth/session-context';
import { CatalogService } from './catalog.service';

const MANAGE = { capability: 'onboarding.manage_catalog' } as const;

@Controller()
export class CatalogController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @TsRestHandler(catalogContract)
  // Every member picks from the catalog, and the money in it is shown by grant (ruling 1A).
  // Adding an own SKU is `add_own_catalog_items` OR the outright manage grant, so its door is
  // `member` and the service decides; every other write, and the price history, is the manage
  // grant's — Finance's limited cell passes this door and the service refuses its writes.
  @RouteAccessMap(catalogContract, {
    items: 'member',
    item: 'member',
    createItem: 'member',
    saveItem: MANAGE,
    archiveItem: MANAGE,
    unarchiveItem: MANAGE,
    saveOverride: MANAGE,
    clearOverride: MANAGE,
    recordRate: MANAGE,
    rateEntries: MANAGE,
  })
  handler(@Req() req: Request) {
    const tenantId = () => tenantIdOf(req);
    const roles = () => rolesOf(req);
    return tsRestHandler(catalogContract, {
      items: async ({ query }) => ({
        status: 200,
        body: await this.catalog.list(tenantId(), roles(), query, Date.now()),
      }),
      item: async ({ params }) => ({
        status: 200,
        body: await this.catalog.item(tenantId(), roles(), params.id, Date.now()),
      }),
      createItem: async ({ body, headers }) => ({
        status: 201,
        body: await this.catalog.createItem(tenantId(), roles(), body, headers, actOf(req)),
      }),
      saveItem: async ({ params, body }) => ({
        status: 200,
        body: await this.catalog.saveItem(tenantId(), roles(), params.id, body, actOf(req)),
      }),
      archiveItem: async ({ params }) => ({
        status: 200,
        body: await this.catalog.setArchived(tenantId(), roles(), params.id, true, actOf(req)),
      }),
      unarchiveItem: async ({ params }) => ({
        status: 200,
        body: await this.catalog.setArchived(tenantId(), roles(), params.id, false, actOf(req)),
      }),
      saveOverride: async ({ params, body, headers }) => ({
        status: 200,
        body: await this.catalog.saveOverride(
          tenantId(),
          roles(),
          params.id,
          body,
          headers,
          actOf(req),
        ),
      }),
      clearOverride: async ({ params }) => ({
        status: 200,
        body: await this.catalog.clearOverride(tenantId(), roles(), params.id, actOf(req)),
      }),
      recordRate: async ({ params, body, headers }) => ({
        status: 201,
        body: await this.catalog.recordRate(
          tenantId(),
          roles(),
          params.id,
          body,
          headers,
          actOf(req),
        ),
      }),
      rateEntries: async ({ params, query }) => ({
        status: 200,
        body: await this.catalog.rateEntries(tenantId(), params.id, query, Date.now()),
      }),
    });
  }
}
