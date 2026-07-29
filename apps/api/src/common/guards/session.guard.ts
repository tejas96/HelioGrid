import type { SessionClaims, SessionResolver } from '@heliogrid/contracts';
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC } from '../decorators/public.decorator';
import { SESSION_RESOLVER } from '../tokens';

/**
 * Tenancy defense-in-depth layer 1 (apps/api/CLAUDE.md): verified session → request claims.
 * Layers 2 (repository tenant filter) and 3 (RLS SET LOCAL) live beneath, in the repositories.
 *
 * Registered globally as APP_GUARD, so every route is authenticated unless it carries
 * `@Public()`. It depends on the SessionResolver PORT, never on `modules/auth` — `common/`
 * may not import a module (dependency-cruiser `common-imports-no-modules`).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SESSION_RESOLVER) private readonly sessions: SessionResolver,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { claims?: SessionClaims }>();
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)]));
    const claims = await this.sessions.resolve(headers);
    if (!claims) throw new UnauthorizedException('Sign in to continue.');

    req.claims = claims;
    return true;
  }
}
