import { savedPartsContract } from '@heliogrid/contracts';
import { can, holdsOutright, type RolePreset } from '@heliogrid/domain';
import { Controller, ForbiddenException, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, rolesOf, tenantIdOf } from '../../common/auth/session-context';
import { SavedPartsService } from './saved-parts.service';

const MANAGE_CATALOG = 'onboarding.manage_catalog';
const MANAGE = { capability: MANAGE_CATALOG } as const;

/** A change is the outright grant's: a limited one — Finance's "view prices & margins" — reads only. */
function admitManager(roles: readonly RolePreset[]): void {
  if (!holdsOutright(roles, MANAGE_CATALOG)) {
    throw new ForbiddenException('Your role reads the saved parts and does not change them.');
  }
}

/**
 * The company's saved parts (`T-M06-034`). Every member reads them: a picker offers them to whoever
 * builds a proposal. Adding one is the catalog-add grant's — `add_own_catalog_items` or
 * `manage_catalog` held outright, either — so the route admits a member and the handler asks for
 * one of the two; editing and archiving are the outright `manage_catalog`'s alone.
 */
@Controller()
export class SavedPartsController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(SavedPartsService) private readonly parts: SavedPartsService) {}

  // Topmost, so it is applied last: it serves each route from what the maps below declared.
  @TsRestHandler(savedPartsContract)
  @RouteBillingMap(savedPartsContract, {
    add: 'create_edit_records',
    save: 'create_edit_records',
    archive: 'create_edit_records',
    restore: 'create_edit_records',
  })
  @RouteAccessMap(savedPartsContract, {
    list: 'member',
    add: 'member',
    save: MANAGE,
    archive: MANAGE,
    restore: MANAGE,
  })
  handler(@Req() req: Request) {
    const tenantId = tenantIdOf(req);
    const act = actOf(req);
    const ok = <Body>(body: Body) => ({ status: 200 as const, body });
    return tsRestHandler(savedPartsContract, {
      list: async ({ query }) => ok(await this.parts.list(tenantId, query)),
      add: async ({ body, headers }) => {
        const roles = rolesOf(req);
        const mayAdd =
          can(roles, 'onboarding.add_own_catalog_items') || holdsOutright(roles, MANAGE_CATALOG);
        if (!mayAdd) throw new ForbiddenException('Adding a part needs the catalog grant.');
        return { status: 201 as const, body: await this.parts.add(tenantId, body, headers, act) };
      },
      save: async ({ params, body }) => {
        admitManager(rolesOf(req));
        return ok(await this.parts.save(tenantId, params.id, body, act));
      },
      archive: async ({ params }) => {
        admitManager(rolesOf(req));
        return ok(await this.parts.setArchived(tenantId, params.id, true, act));
      },
      restore: async ({ params }) => {
        admitManager(rolesOf(req));
        return ok(await this.parts.setArchived(tenantId, params.id, false, act));
      },
    });
  }
}
