import { randomUUID } from 'node:crypto';
import { type Db, userAccount } from '@heliogrid/db';
import { eq } from 'drizzle-orm';
import { TEST_GOOGLE_TOKEN_PREFIX } from '../../src/modules/auth/internal/google-identity.test-double';
import type { Challenge } from './challenges';
import { aPerson, type Person } from './fixture';
import type { Http } from './http';

/**
 * The Google door's proofs (`M01-02`) share these: a token the api's test double reads, a fresh
 * Google subject, a person whose account already holds a login, and the two calls a device makes.
 */

/** Every code a seeded challenge carries; the proof knows it, as a person reading an SMS does. */
export const GOOGLE_CODE = '482913';

export const googleToken = (subject: string, nonce?: string): string =>
  `${TEST_GOOGLE_TOKEN_PREFIX}${subject}${nonce === undefined ? '' : `:${nonce}`}`;
export const aSubject = (label: string): string => `g-${label}-${randomUUID()}`;
export const linkedTo = (name: string): Person => ({
  ...aPerson(name),
  googleSubject: aSubject(name),
});

export interface GoogleAnswer {
  readonly actor?: { readonly userId: string };
  readonly error?: { readonly code: string };
}

/** A plain Google call — the body's other fields as given, the platform `web` unless set. */
export const callGoogle = (
  http: Http,
  body: Record<string, unknown>,
  headers?: Record<string, string>,
) =>
  http.callAnonymously<GoogleAnswer>('POST', '/auth/google', { platform: 'web', ...body }, headers);

/** A Google call carrying the code for a phone in `link`. */
export const linkGoogle = (http: Http, subject: string, challenge: Challenge, code = GOOGLE_CODE) =>
  callGoogle(http, {
    idToken: googleToken(subject),
    link: { challengeId: challenge.challengeId, code },
  });

/** The Google login the account at this phone holds, or null — read on the admin path. */
export async function subjectAt(db: Db, phoneE164: string): Promise<string | null> {
  const [row] = await db
    .select({ subject: userAccount.googleSubject })
    .from(userAccount)
    .where(eq(userAccount.phoneE164, phoneE164));
  return row?.subject ?? null;
}
