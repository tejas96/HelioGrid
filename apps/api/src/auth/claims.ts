import type { RolePreset } from '@heliogrid/contracts';
import {
  type CanActivate,
  type CustomDecorator,
  createParamDecorator,
  type ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Auth } from './better-auth';
import { AUTH } from './tokens';

/**
 * Tenancy defense-in-depth layer 1 (rules/api.md): Better Auth session → request claims.
 * Layers 2 (repository tenant filter) and 3 (RLS SET LOCAL) live in AuthService's
 * withTenantTransaction usage. The established decorator set is @Public(), @CurrentClaims
 * (@CurrentTenant/@CurrentUser read from it) — no other custom decorators (rules/api.md).
 */

export interface SessionClaims {
  userId: string;
  phoneE164: string;
  /** Null until onboarding/accept-invite completes. */
  tenantId: string | null;
  roles: RolePreset[];
}

export const IS_PUBLIC = 'isPublic';
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC, true);

export const CurrentClaims = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<Request & { claims?: SessionClaims }>().claims;
});

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH) private readonly auth: Auth,
    @Inject('CLAIMS_RESOLVER')
    private readonly resolveTenant: (userId: string) => Promise<{
      tenantId: string | null;
      roles: RolePreset[];
    }>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { claims?: SessionClaims }>();
    const session = await this.auth.api.getSession({
      headers: new Headers(Object.entries(req.headers).map(([k, v]) => [k, String(v)])),
    });
    if (!session?.user) throw new UnauthorizedException('Sign in to continue.');

    const { tenantId, roles } = await this.resolveTenant(session.user.id);
    req.claims = {
      userId: session.user.id,
      phoneE164: (session.user as { phoneNumber?: string }).phoneNumber ?? '',
      tenantId,
      roles,
    };
    return true;
  }
}
