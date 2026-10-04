import type { GoogleIdentity, GoogleIdentityVerdict } from '@heliogrid/contracts';
import { ENV } from '../../../config/env';

/** A token the double accepts: `test-google:<subject>`, or `test-google:<subject>:<nonce>`. */
export const TEST_GOOGLE_TOKEN_PREFIX = 'test-google:';
/** The token the double answers as though Google's keys could not be fetched. */
export const TEST_GOOGLE_UNAVAILABLE = 'test-google-unavailable';

/**
 * The Google check the api's own tests sign in through (`M01-02`): no agent and no suite can hold
 * a real Google login, so the binding rule is proven over HTTP with tokens this double reads.
 * Bound only under `NODE_ENV=test`, and it refuses to be built anywhere else — a door that accepts
 * a typed subject must never face a person.
 */
export class TestGoogleIdentity implements GoogleIdentity {
  constructor() {
    if (ENV.NODE_ENV !== 'test') {
      throw new Error('The test Google identity runs only under NODE_ENV=test.');
    }
  }

  async verify(
    idToken: string,
    audiences: readonly string[],
    nonce: string | undefined,
  ): Promise<GoogleIdentityVerdict> {
    if (idToken === TEST_GOOGLE_UNAVAILABLE) return { kind: 'unavailable' };
    if (audiences.length === 0 || !idToken.startsWith(TEST_GOOGLE_TOKEN_PREFIX)) {
      return { kind: 'refused' };
    }
    const [subject, carried] = idToken.slice(TEST_GOOGLE_TOKEN_PREFIX.length).split(':');
    if (subject === undefined || subject === '') return { kind: 'refused' };
    if (nonce !== undefined && carried !== nonce) return { kind: 'refused' };
    return { kind: 'verified', subject };
  }
}
