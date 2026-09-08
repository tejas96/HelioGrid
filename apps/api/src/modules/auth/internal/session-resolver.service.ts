import type { ResolvedSession, SessionResolver } from '@heliogrid/contracts';
import { admit, isSessionLive } from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { bearerOrTokenCookie } from '../../../common/auth/cookies';
import { AuthAdminRepository } from './auth.admin.repository';
import { lifeOf, projectionOf } from './session.projection';
import { TokenService } from './token.service';

/**
 * The `SessionResolver` port, implemented: the token is verified, its session must still be
 * live, and its membership claim is compared to the row (`M01-07`, `F2-17`) — a token is never
 * trusted for its remaining life. Three primary-key reads per request, on the admin pool because
 * the session and the account are platform tables no tenant role reaches.
 */
@Injectable()
export class SessionResolverService implements SessionResolver {
  // Explicit tokens: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(
    @Inject(AuthAdminRepository) private readonly store: AuthAdminRepository,
    @Inject(TokenService) private readonly tokens: TokenService,
  ) {}

  async resolve(request: unknown): Promise<ResolvedSession | null> {
    const token = bearerOrTokenCookie(request as Request);
    if (token === undefined) return null;
    const now = Date.now();
    const claims = await this.tokens.verify(token, now);
    if (claims === null) return null;
    const [row, account] = await Promise.all([
      this.store.sessionById(claims.sid),
      this.store.accountById(claims.sub),
    ]);
    if (!row || !account || row.userAccountId !== account.id) return null;
    if (!isSessionLive(lifeOf(row), now)) return null;
    if (claims.membership === null) {
      return { session: projectionOf(account, null, row), sessionId: row.id };
    }
    const membership = await this.store.membership(account.id, claims.membership.tenantId);
    const admission = admit(claims.membership, membership);
    if (!admission.admitted) return null;
    return { session: projectionOf(account, membership, row), sessionId: row.id };
  }
}
