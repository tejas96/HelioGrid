import type { GoogleIdentity, GoogleIdentityVerdict } from '@heliogrid/contracts';
import { createRemoteJWKSet, errors, type JWTVerifyGetKey, jwtVerify } from 'jose';

/** Where Google publishes the keys its ID tokens are signed with. */
const GOOGLE_KEYS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');
/** Google writes either form into `iss`; both are Google. */
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/** The key set could not be fetched or read; raised only by the key lookup below. */
class KeysUnreachable extends Error {}

/**
 * The real Google check (`M01-02`): the signature against Google's published keys, the issuer,
 * one of this environment's client ids as the audience, the expiry, and the nonce when the device
 * sent one. A key set that cannot be fetched — a timeout, a network failure, a non-200, a body
 * that is not a key set — is `unavailable`, never a refusal: the person did nothing wrong, and
 * "refused" would send them round the linking flow for nothing.
 */
export class JoseGoogleIdentity implements GoogleIdentity {
  constructor(private readonly keys: JWTVerifyGetKey = createRemoteJWKSet(GOOGLE_KEYS_URL)) {}

  async verify(
    idToken: string,
    audiences: readonly string[],
    nonce: string | undefined,
  ): Promise<GoogleIdentityVerdict> {
    try {
      const { payload } = await jwtVerify(idToken, this.judgedKeys, {
        issuer: GOOGLE_ISSUERS,
        audience: [...audiences],
      });
      if (typeof payload.sub !== 'string' || payload.sub === '') return { kind: 'refused' };
      if (nonce !== undefined && payload.nonce !== nonce) return { kind: 'refused' };
      return { kind: 'verified', subject: payload.sub };
    } catch (error) {
      return error instanceof KeysUnreachable ? { kind: 'unavailable' } : { kind: 'refused' };
    }
  }

  /**
   * The key lookup, with its failures sorted: a key the token names that the set does not hold
   * judges the TOKEN; anything else the lookup throws means the set never arrived.
   */
  private readonly judgedKeys: JWTVerifyGetKey = async (header, token) => {
    try {
      return await this.keys(header, token);
    } catch (error) {
      if (error instanceof errors.JWKSNoMatchingKey) throw error;
      if (error instanceof errors.JWKSMultipleMatchingKeys) throw error;
      throw new KeysUnreachable();
    }
  };
}
