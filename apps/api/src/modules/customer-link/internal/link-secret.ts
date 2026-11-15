import { hashSecret, keyedSecret } from '../../../common/auth/secrets';
import { ENV } from '../../../config/env';

/*
 * A link's address (`F5-21`, `F5-75`): its token's secret is made from the token's own id and the
 * api's token key — 32 bytes, base64url, unguessable without the key — so the store holds only its
 * hash, and the one act that shows an address again (`customerLinks.address`) makes the same value
 * the hash was taken from. The address names no person and no company (`F5-77`).
 */

/** The secret a token's address carries; never stored. */
export function linkTokenSecret(tokenId: string): string {
  return keyedSecret(ENV.AUTH_TOKEN_SECRET, `customer-link:${tokenId}`);
}

/** What the store holds for a token, and what a presented token is looked up by. */
export function linkTokenHash(secret: string): string {
  return hashSecret(secret);
}

/** The page the customer opens: the web's own, at the token and nothing else. */
export function linkAddressOf(tokenId: string): string {
  return `${ENV.WEB_ORIGIN}/p/${linkTokenSecret(tokenId)}`;
}
