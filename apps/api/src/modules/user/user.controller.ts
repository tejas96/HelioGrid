import { userContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { RouteBillingMap } from '../../common/auth/route-billing';
import { actOf, sessionOf, tenantIdOf } from '../../common/auth/session-context';
import { UserService } from './user.service';

@Controller()
export class UserController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(UserService) private readonly users: UserService) {}

  @TsRestHandler(userContract)
  @RouteBillingMap(userContract, { updateMe: 'ungated', setMyPhoto: 'ungated' })
  @RouteAccessMap(userContract, { updateMe: 'session', getMyPhoto: 'member', setMyPhoto: 'member' })
  handler(@Req() req: Request) {
    return tsRestHandler(userContract, {
      updateMe: async ({ body }) => ({
        status: 200,
        body: await this.users.updateMe(sessionOf(req).actor.userId, body),
      }),
      getMyPhoto: async () => ({
        status: 200,
        body: await this.users.myPhoto(tenantIdOf(req), sessionOf(req).actor.userId),
      }),
      setMyPhoto: async ({ body }) => ({
        status: 200,
        body: await this.users.setMyPhoto(tenantIdOf(req), body.fileId, actOf(req)),
      }),
    });
  }
}
