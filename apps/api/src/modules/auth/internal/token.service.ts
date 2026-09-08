import { type SessionClaims, sessionClaimsSchema } from '@heliogrid/contracts';
import { apiTokenExpiresAt } from '@heliogrid/domain';
import { Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT } from 'jose';
import { ENV } from '../../../config/env';

const ALGORITHM = 'HS256';
const MS_PER_SECOND = 1_000;

/**
 * The API token (`M01-07`): a signed JWT carrying the session claims and nothing more, alive
 * for `API_TOKEN_MINUTES`. Signed and verified here alone, with the one secret the environment
 * declares; rotating that secret signs every device out within one token life.
 */
@Injectable()
export class TokenService {
  private readonly key = new TextEncoder().encode(ENV.AUTH_TOKEN_SECRET);

  async mint(claims: SessionClaims, now: number): Promise<{ token: string; expiresAt: number }> {
    const expiresAt = apiTokenExpiresAt(now);
    const token = await new SignJWT({ sid: claims.sid, membership: claims.membership })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(claims.sub)
      .setIssuedAt(Math.floor(now / MS_PER_SECOND))
      .setExpirationTime(Math.floor(expiresAt / MS_PER_SECOND))
      .sign(this.key);
    return { token, expiresAt };
  }

  /** The claims of a token that verifies and is not yet expired; `null` for anything else. */
  async verify(token: string, now: number): Promise<SessionClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ALGORITHM],
        currentDate: new Date(now),
      });
      const parsed = sessionClaimsSchema.safeParse({
        sub: payload.sub,
        sid: payload.sid,
        membership: payload.membership,
      });
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }
}
