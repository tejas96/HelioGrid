import { authContract } from '@heliogrid/contracts';
import { Controller, ForbiddenException, Inject, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AuthService } from './auth.service';
import { CurrentClaims, type SessionClaims, SessionGuard } from './claims';

const TEAM_MANAGERS = ['owner', 'manager'] as const;

function requireTenant(claims: SessionClaims): asserts claims is SessionClaims & {
  tenantId: string;
} {
  if (!claims.tenantId) throw new ForbiddenException('Complete onboarding first.');
}

function requireTeamManager(claims: SessionClaims) {
  if (!claims.roles.some((r) => (TEAM_MANAGERS as readonly string[]).includes(r)))
    throw new ForbiddenException('Team management needs the owner or manager role.');
}

@Controller()
@UseGuards(SessionGuard)
export class AuthController {
  // Explicit token: tsx (esbuild) emits no decorator metadata, so type-only injection
  // fails under `pnpm dev` — every constructor param in this app carries @Inject.
  constructor(@Inject(AuthService) private readonly service: AuthService) {}

  @TsRestHandler(authContract)
  handler(@CurrentClaims() claims: SessionClaims) {
    return tsRestHandler(authContract, {
      me: async () => {
        const me = await this.service.me(claims.userId, claims.tenantId, claims.roles);
        if (!me) {
          return {
            status: 200,
            body: {
              user: {
                id: claims.userId,
                name: claims.phoneE164,
                phoneE164: claims.phoneE164,
                language: 'en' as const,
                unitsPref: 'm' as const,
                roles: claims.roles,
              },
              tenant: null,
            },
          };
        }
        return { status: 200, body: me };
      },

      completeOnboarding: async ({ body }) => {
        const created = await this.service.completeOnboarding(
          claims.userId,
          claims.phoneE164,
          body,
        );
        return { status: 201, body: created };
      },

      updateProfile: async ({ body }) => {
        requireTenant(claims);
        await this.service.updateProfile(claims.userId, claims.tenantId, body);
        const me = await this.service.me(claims.userId, claims.tenantId, claims.roles);
        if (!me) throw new ForbiddenException('Profile unavailable.');
        return { status: 200, body: me };
      },

      listTeam: async () => {
        requireTenant(claims);
        return { status: 200, body: { members: await this.service.listTeam(claims.tenantId) } };
      },

      setMemberRoles: async ({ params, body }) => {
        requireTenant(claims);
        requireTeamManager(claims);
        const result = await this.service.setMemberRoles(
          claims.tenantId,
          params.userId,
          body.roles,
        );
        if (result === 'LAST_OWNER') {
          return {
            status: 422,
            body: {
              error: {
                code: 'LAST_OWNER' as const,
                message: 'Every workspace keeps at least one owner.',
                requestId: 'auth',
              },
            },
          };
        }
        return { status: 200, body: result };
      },

      createInvite: async ({ body }) => {
        requireTenant(claims);
        requireTeamManager(claims);
        const { row, token } = await this.service.createInvite(
          claims.tenantId,
          claims.userId,
          body.phoneE164,
          body.roles,
        );
        return { status: 201, body: { ...serializeInvite(row), token } };
      },

      listInvites: async ({ query }) => {
        requireTenant(claims);
        requireTeamManager(claims);
        const rows = await this.service.listInvites(claims.tenantId, query.limit);
        return { status: 200, body: { items: rows.map(serializeInvite) } };
      },

      revokeInvite: async ({ params }) => {
        requireTenant(claims);
        requireTeamManager(claims);
        const row = await this.service.revokeInvite(claims.tenantId, params.inviteId);
        return { status: 200, body: { inviteId: row.id, status: 'revoked' as const } };
      },

      acceptInvite: async ({ body }) => {
        const result = await this.service.acceptInvite(
          claims.userId,
          claims.phoneE164,
          body.token,
          body.userName,
        );
        switch (result.kind) {
          case 'OK':
            return {
              status: 201,
              body: { tenantId: result.tenantId, userId: result.userId },
            };
          case 'NOT_FOUND':
            return {
              status: 404,
              body: envelope('NOT_FOUND', 'That invite link is not valid.'),
            };
          case 'ALREADY_ONBOARDED':
            return {
              status: 409,
              body: envelope('ALREADY_ONBOARDED', 'This account already has a workspace.'),
            };
          case 'INVITE_NOT_PENDING':
            return {
              status: 409,
              body: envelope('INVITE_NOT_PENDING', 'That invite was already used or expired.'),
            };
          case 'PHONE_MISMATCH':
            return {
              status: 422,
              body: envelope('PHONE_MISMATCH', 'This invite was sent to a different number.'),
            };
        }
      },
    });
  }
}

function envelope<C extends string>(code: C, message: string) {
  return { error: { code, message, requestId: 'auth' } };
}

function serializeInvite(row: {
  id: string;
  phoneE164: string;
  roles: string[];
  status: string;
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
}) {
  return {
    id: row.id,
    phoneE164: row.phoneE164,
    roles: row.roles as (
      | 'owner'
      | 'manager'
      | 'sales_rep'
      | 'surveyor'
      | 'designer'
      | 'engineer'
    )[],
    status: row.status as 'pending' | 'accepted' | 'expired' | 'revoked',
    invitedByUserId: row.invitedBy,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
