import { userContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { sessionOf } from '../../common/auth/session-context';
import { UserService } from './user.service';

@Controller()
export class UserController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(UserService) private readonly users: UserService) {}

  @TsRestHandler(userContract)
  @RouteAccessMap(userContract, { updateMe: 'session' })
  handler(@Req() req: Request) {
    return tsRestHandler(userContract, {
      updateMe: async ({ body }) => ({
        status: 200,
        body: await this.users.updateMe(sessionOf(req).actor.userId, body),
      }),
    });
  }
}
