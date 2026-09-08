import { tenantContract } from '@heliogrid/contracts';
import { Controller, Inject, NotFoundException, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { responseOf, setTokenCookie } from '../../common/auth/cookies';
import { sessionIdOf, sessionOf } from '../../common/auth/session-context';
import { TenantService } from './tenant.service';

/** The membership the guard admitted; `member` access guarantees it is there. */
function tenantIdOf(req: Request): string {
  const membership = sessionOf(req).membership;
  if (membership === null) throw new NotFoundException('This session has no company.');
  return membership.tenantId;
}

@Controller()
export class TenantController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TenantService) private readonly tenants: TenantService) {}

  @TsRestHandler(tenantContract)
  @RouteAccessMap(tenantContract, {
    create: 'session',
    me: 'member',
    members: 'member',
    similar: 'session',
  })
  handler(@Req() req: Request) {
    const res = responseOf(req);
    return tsRestHandler(tenantContract, {
      create: async ({ body }) => {
        const created = await this.tenants.create(
          sessionOf(req),
          sessionIdOf(req),
          body,
          Date.now(),
        );
        setTokenCookie(res, created.token.token, created.token.expiresAt);
        return { status: 201, body: created.projection };
      },
      me: async () => {
        const body = await this.tenants.me(tenantIdOf(req));
        if (body === null) throw new NotFoundException('This company no longer exists.');
        return { status: 200, body };
      },
      members: async ({ query }) => ({
        status: 200,
        body: await this.tenants.members(tenantIdOf(req), query),
      }),
      similar: async ({ query }) => ({
        status: 200,
        body: { items: await this.tenants.similar(query.companyName, query.city) },
      }),
    });
  }
}
