import { invitationContract } from '@heliogrid/contracts';
import { Controller, Inject, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { RouteAccessMap } from '../../common/auth/access';
import { responseOf, setTokenCookie } from '../../common/auth/cookies';
import { actOf, sessionIdOf, sessionOf, tenantIdOf } from '../../common/auth/session-context';
import { InvitationService } from './invitation.service';

@Controller()
export class InvitationController {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(InvitationService) private readonly invitations: InvitationService) {}

  @TsRestHandler(invitationContract)
  // The tenant side is the team administrator's (`M01.2` permissions); the landing side is the
  // invited person's, who holds no session until they verify — the link's secret is the key.
  @RouteAccessMap(invitationContract, {
    create: { capability: 'onboarding.manage_team' },
    list: { capability: 'onboarding.manage_team' },
    revoke: { capability: 'onboarding.manage_team' },
    landing: 'public',
    accept: 'session',
    decline: 'public',
    requestReinvite: 'public',
  })
  handler(@Req() req: Request) {
    const res = responseOf(req);
    return tsRestHandler(invitationContract, {
      create: async ({ body }) => ({
        status: 201,
        body: await this.invitations.create(tenantIdOf(req), body, actOf(req)),
      }),
      list: async ({ query }) => ({
        status: 200,
        body: await this.invitations.list(tenantIdOf(req), query, Date.now()),
      }),
      revoke: async ({ params }) => ({
        status: 200,
        body: await this.invitations.revoke(tenantIdOf(req), params.id, actOf(req)),
      }),
      landing: async ({ params }) => ({
        status: 200,
        body: await this.invitations.landing(params.token, Date.now()),
      }),
      accept: async ({ params }) => {
        const joined = await this.invitations.accept(
          sessionOf(req),
          sessionIdOf(req),
          params.token,
          Date.now(),
        );
        setTokenCookie(res, joined.token.token, joined.token.expiresAt);
        return { status: 200, body: joined.projection };
      },
      decline: async ({ params }) => {
        await this.invitations.decline(params.token, Date.now());
        return { status: 204, body: undefined };
      },
      requestReinvite: async ({ params }) => {
        await this.invitations.requestReinvite(params.token, Date.now());
        return { status: 204, body: undefined };
      },
    });
  }
}
