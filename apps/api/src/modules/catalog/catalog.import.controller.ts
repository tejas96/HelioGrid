import { catalogImportContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { actOf, rolesOf, tenantIdOf } from '../../common/auth/session-context';
import { CatalogImportService } from './catalog.import.service';
import { CatalogImportPreviewService } from './catalog.import-preview.service';
import { MANAGE_CATALOG } from './internal/write-checks';

const MANAGE = { capability: MANAGE_CATALOG } as const;

@Controller()
export class CatalogImportController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(CatalogImportService) private readonly imports: CatalogImportService,
    @Inject(CatalogImportPreviewService) private readonly previews: CatalogImportPreviewService,
  ) {}

  @TsRestHandler(catalogImportContract)
  // Every door is the manage grant's; Finance's limited cell passes it and the service refuses it,
  // since an import writes prices (`T-M01-030c` decision 9).
  @RouteAccessMap(catalogImportContract, {
    start: MANAGE,
    imports: MANAGE,
    import: MANAGE,
    map: MANAGE,
    rows: MANAGE,
    fix: MANAGE,
  })
  handler(@Req() req: Request) {
    const tenantId = () => tenantIdOf(req);
    const roles = () => rolesOf(req);
    return tsRestHandler(catalogImportContract, {
      start: async ({ body, headers }) => ({
        status: 201,
        body: await this.imports.start(tenantId(), roles(), body, headers, actOf(req)),
      }),
      imports: async ({ query }) => ({
        status: 200,
        body: await this.imports.imports(tenantId(), roles(), query),
      }),
      import: async ({ params }) => ({
        status: 200,
        body: await this.imports.import(tenantId(), roles(), params.id),
      }),
      map: async ({ params, body }) => ({
        status: 200,
        body: await this.imports.map(tenantId(), roles(), params.id, body, actOf(req).now),
      }),
      rows: async ({ params, query }) => ({
        status: 200,
        body: await this.previews.page(tenantId(), roles(), params.id, query, actOf(req).now),
      }),
      fix: async ({ params, body }) => ({
        status: 200,
        body: await this.previews.fix(
          tenantId(),
          roles(),
          params.id,
          params.rowNumber,
          body,
          actOf(req).now,
        ),
      }),
    });
  }
}
