import type { SessionClaims, SessionResolver } from '@heliogrid/contracts';
import type { AuthService } from '../auth.service';
import type { Auth } from './better-auth';

/**
 * The auth module's implementation of the SessionResolver port. Verification (Better Auth)
 * and tenancy resolution happen together, so a caller can never hold a verified user without
 * the claims that authorize them.
 *
 * This is the ONLY place `common/`'s guard reaches auth behaviour, and it does so through the
 * port — swapping the identity provider replaces this file and one `provide:` line.
 */
export function createSessionResolver(auth: Auth, service: AuthService): SessionResolver {
  return {
    async resolve(headers: Record<string, string>): Promise<SessionClaims | null> {
      const session = await auth.api.getSession({
        headers: new Headers(Object.entries(headers)),
      });
      if (!session?.user) return null;

      const { tenantId, roles } = await service.resolveTenant(session.user.id);
      return {
        userId: session.user.id,
        phoneE164: (session.user as { phoneNumber?: string }).phoneNumber ?? '',
        tenantId,
        roles,
      };
    },
  };
}
