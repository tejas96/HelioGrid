import { SESSION_RESOLVER, type SessionResolver } from '@heliogrid/contracts';
import { can } from '@heliogrid/domain';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { accessOf, ROUTE_ACCESS, type RouteAccess, routeKey } from './access';
import { attachSession } from './session-context';

/**
 * The ONE deny-by-default guard (`M15`). Every route's access is read from the map its
 * controller declared; a route with no entry is denied. It depends on the `SessionResolver`
 * PORT, never on the auth module's service class — `common/` may not import a module, and the
 * port is what lets the guard be bound in the root module without the injector failing at boot.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SESSION_RESOLVER) private readonly sessions: SessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const declared = this.reflector.get<Map<string, RouteAccess> | undefined>(
      ROUTE_ACCESS,
      context.getHandler(),
    );
    const access = accessOf(declared, req);
    if (access === undefined) {
      /*
       * Silence is denial: a route nobody declared is not served. The message names the KEY that
       * was looked up, because there are two ways to land here and they need opposite fixes —
       * a route that really declares nothing, or a route whose declaration is keyed on the
       * CONTRACT path while the lookup uses the EXPRESS one. The second reads as an auth failure
       * and sends the reader to sessions and tokens; the key in the message ends that hunt.
       */
      const attempted = routeKey(
        req.method,
        (req.route as { path?: string } | undefined)?.path ?? '?',
      );
      throw new UnauthorizedException(
        `This route declares no access for ${attempted}. Either it declares none, or its ` +
          'declared path and its served path have diverged.',
      );
    }
    if (access === 'public' || access === 'session-cookie') return true;

    const resolved = await this.sessions.resolve(req);
    if (resolved === null) throw new UnauthorizedException('Sign in to continue.');
    attachSession(req, resolved);
    if (access === 'session') return true;

    const membership = resolved.session.membership;
    if (membership === null) throw new ForbiddenException('This needs a company.');
    if (access === 'member') return true;
    if (!can(membership.roles, access.capability)) {
      throw new ForbiddenException('Your roles do not grant this.');
    }
    return true;
  }
}
