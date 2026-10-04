import {
  createLocalJWKSet,
  errors,
  exportJWK,
  generateKeyPair,
  type JWTVerifyGetKey,
  SignJWT,
} from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { JoseGoogleIdentity } from '../../src/modules/auth/internal/google-identity.jose';

/**
 * The real Google check (`M01-02`) against a key set this test signs with, so every refusal is
 * proven without the network: the signature, the issuer, the audience, the expiry, the nonce —
 * and a key set that cannot be fetched reads `unavailable`, never `refused`.
 */

const AUDIENCE = 'web-client.apps.googleusercontent.com';
const ISSUER = 'https://accounts.google.com';
const SUBJECT = '110169484474386276334';

let keys: JWTVerifyGetKey;
type PrivateKey = Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];

let signingKey: PrivateKey;
let strangerKey: PrivateKey;

beforeAll(async () => {
  const google = await generateKeyPair('RS256');
  const stranger = await generateKeyPair('RS256');
  signingKey = google.privateKey;
  strangerKey = stranger.privateKey;
  keys = createLocalJWKSet({
    keys: [{ ...(await exportJWK(google.publicKey)), kid: 'google', alg: 'RS256' }],
  });
});

interface Claims {
  readonly iss?: string;
  readonly aud?: string;
  readonly sub?: string;
  readonly nonce?: string;
  readonly expiresIn?: string;
  readonly key?: 'google' | 'stranger';
}

async function aToken(claims: Claims = {}): Promise<string> {
  const jwt = new SignJWT(claims.nonce === undefined ? {} : { nonce: claims.nonce })
    .setProtectedHeader({ alg: 'RS256', kid: 'google' })
    .setIssuer(claims.iss ?? ISSUER)
    .setAudience(claims.aud ?? AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(claims.expiresIn ?? '1h');
  if (claims.sub !== '') jwt.setSubject(claims.sub ?? SUBJECT);
  return jwt.sign(claims.key === 'stranger' ? strangerKey : signingKey);
}

describe('JoseGoogleIdentity', () => {
  it.each<[string, Claims, string | undefined, string]>([
    ['a good token', {}, undefined, 'verified'],
    ['the other spelling of the issuer', { iss: 'accounts.google.com' }, undefined, 'verified'],
    ['a nonce that matches', { nonce: 'n-1' }, 'n-1', 'verified'],
    ['a token for another app', { aud: 'other.apps.googleusercontent.com' }, undefined, 'refused'],
    ['an issuer that is not Google', { iss: 'https://evil.example' }, undefined, 'refused'],
    ['an expired token', { expiresIn: '-1m' }, undefined, 'refused'],
    ['a signature by another key', { key: 'stranger' }, undefined, 'refused'],
    ['a nonce that does not match', { nonce: 'n-1' }, 'n-2', 'refused'],
    ['a nonce the device sent but the token lacks', {}, 'n-1', 'refused'],
    ['no subject', { sub: '' }, undefined, 'refused'],
  ])('%s', async (_, claims, nonce, kind) => {
    const verdict = await new JoseGoogleIdentity(keys).verify(
      await aToken(claims),
      [AUDIENCE],
      nonce,
    );
    expect(verdict.kind).toBe(kind);
    if (verdict.kind === 'verified') expect(verdict.subject).toBe(SUBJECT);
  });

  it('a string that is no token is refused', async () => {
    const verdict = await new JoseGoogleIdentity(keys).verify('not-a-token', [AUDIENCE], undefined);
    expect(verdict.kind).toBe('refused');
  });

  it.each<[string, () => never]>([
    [
      'the key set timing out',
      () => {
        throw new errors.JWKSTimeout();
      },
    ],
    [
      'the network failing',
      () => {
        throw new TypeError('fetch failed');
      },
    ],
    [
      'Google answering something other than 200',
      () => {
        throw new errors.JOSEError('Expected 200 OK from the JSON Web Key Set HTTP response');
      },
    ],
    [
      'a body that is not a key set',
      () => {
        throw new errors.JWKSInvalid();
      },
    ],
  ])('%s reads unavailable', async (_, failing) => {
    const verdict = await new JoseGoogleIdentity(failing).verify(
      await aToken(),
      [AUDIENCE],
      undefined,
    );
    expect(verdict.kind).toBe('unavailable');
  });
});
