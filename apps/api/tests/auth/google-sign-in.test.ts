import { authIdentity, otpChallenge, session, userAccount } from '@heliogrid/db';
import {
  OTP_EXPIRY_SECONDS,
  OTP_INVALIDATIONS_TO_LOCK,
  OTP_MAX_FAILED_VERIFIES,
  OTP_REQUEST_WINDOW_MINUTES,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { and, count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '../../src/common/auth/cookies';
import {
  aChallenge,
  aCompany,
  aDevice,
  aPerson,
  aPhone,
  type Challenge,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import {
  type GoogleAnswer as Answer,
  aSubject,
  GOOGLE_CODE as CODE,
  callGoogle,
  linkedTo,
  linkGoogle,
  subjectAt,
  googleToken as token,
} from '../support/google';
import { bootHttp, type Http } from '../support/http';

/*
 * The client ids come from this file, never a developer's `.env.local`: CI sets none, and the
 * door refuses every token without them before the binding rule this suite proves is reached.
 */
vi.mock('../../src/config/env', async (original) => {
  const real = (await original()) as { ENV: Record<string, unknown> };
  return { ENV: { ...real.ENV, GOOGLE_CLIENT_IDS: ['suite-web.apps.googleusercontent.com'] } };
});

/**
 * The Google door on the WIRE (`M01-02`, `M01-04`): a linked login signs in as its phone account
 * and makes no second one; an unlinked login links only once the code for a phone matches, and
 * the code and the link are spent together. Tokens are the test double's — no suite can hold a
 * real Google login — so every case here is the binding rule, not Google's signature (that is
 * `google-identity.test.ts`; the races and the edges are `google-sign-in-edges.test.ts`). Each phone is seeded
 * with its own code requests: the development numbers skip the lock and already hold accounts.
 */

const WRONG = '111111';
const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const now = Date.now();

const company = aCompany('Suryodaya Solar');
const linked = linkedTo('Rajesh Sharma');
const unlinked = aPerson('Priya Kulkarni');
const taken = linkedTo('Kavita Joshi');
const locked = linkedTo('Suresh Nair');
const misses = aPerson('Anil Deshmukh');
const handedOver = linkedTo('Meera Iyer');
const lastUser = aPerson('Field Phone Previous');
const retried = aPerson('Retried Link');
const rowed = aPerson('Row Proof');
const freshPhone = aPhone();

const unlinkedCode = aChallenge(unlinked.phoneE164, CODE);
const takenCode = aChallenge(taken.phoneE164, CODE);
const takenWrongCode = aChallenge(taken.phoneE164, CODE);
const otherPhoneCode = aChallenge(unlinked.phoneE164, CODE);
const wrongCode = aChallenge(misses.phoneE164, CODE);
const expiredCode = aChallenge(misses.phoneE164, CODE, {
  issuedAt: now - (OTP_EXPIRY_SECONDS * MS_PER_SECOND + MS_PER_MINUTE),
});
const spentCode = aChallenge(misses.phoneE164, CODE, { verifiedAt: now - MS_PER_MINUTE });
const lastMissCode = aChallenge(misses.phoneE164, CODE, {
  failedVerifies: OTP_MAX_FAILED_VERIFIES - 1,
});
const freshCode = aChallenge(freshPhone, CODE);
const retriedCode = aChallenge(retried.phoneE164, CODE);
const rowCode = aChallenge(rowed.phoneE164, CODE);
// Codes used up in a row: asked before the request window, used up inside the lock (`M01-04`).
const lockedHistory = Array.from({ length: OTP_INVALIDATIONS_TO_LOCK }, (_, index) =>
  aChallenge(locked.phoneE164, CODE, {
    issuedAt: now - (OTP_REQUEST_WINDOW_MINUTES + 1) * MS_PER_MINUTE,
    failedVerifies: OTP_MAX_FAILED_VERIFIES,
    invalidatedAt: now - (index + 1) * MS_PER_MINUTE,
  }),
);
const lastUserDevice = aDevice(lastUser, company);

const fixture: Fixture = {
  companies: [company],
  people: [linked, unlinked, taken, locked, misses, handedOver, lastUser, retried, rowed],
  memberships: [],
  devices: [lastUserDevice],
  challenges: [
    unlinkedCode,
    takenCode,
    takenWrongCode,
    otherPhoneCode,
    wrongCode,
    expiredCode,
    spentCode,
    lastMissCode,
    freshCode,
    retriedCode,
    rowCode,
    ...lockedHistory,
  ],
};

const skip = skipWithoutDatabase(
  'GOOGLE SIGN-IN WIRE PROOF',
  'The Google door is UNPROVEN on the wire in this run — only its pure rule is.',
);

describe.skipIf(skip)('the Google door, over HTTP', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const google = (body: Record<string, unknown>, headers?: Record<string, string>) =>
    callGoogle(http, body, headers);
  const linking = (subject: string, challenge: Challenge, code = CODE) =>
    linkGoogle(http, subject, challenge, code);
  // Scoped to one phone: other suites make accounts while this one runs.
  const accountsAt = async (phoneE164: string) =>
    (
      await pools.admin.db
        .select({ n: count() })
        .from(userAccount)
        .where(eq(userAccount.phoneE164, phoneE164))
    )[0]?.n ?? 0;
  const holdersOf = async (subject: string) =>
    (
      await pools.admin.db
        .select({ n: count() })
        .from(authIdentity)
        .where(and(eq(authIdentity.provider, 'google'), eq(authIdentity.subject, subject)))
    )[0]?.n ?? 0;
  const subjectOf = (person: { phoneE164: string }) => subjectAt(pools.admin.db, person.phoneE164);
  const challengeRow = async (challenge: Challenge) =>
    (
      await pools.admin.db
        .select()
        .from(otpChallenge)
        .where(eq(otpChallenge.id, challenge.challengeId))
    )[0];

  beforeAll(async () => {
    pools = openPools();
    await unseed(pools.admin.db, fixture);
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http?.close();
    if (pools) {
      // The account the new-number link made is the api's, so it is found by its phone.
      const made = await pools.admin.db
        .select({ userId: userAccount.id, phoneE164: userAccount.phoneE164 })
        .from(userAccount)
        .where(eq(userAccount.phoneE164, freshPhone));
      const people = made.map((row) => ({ ...row, name: '' }));
      await unseed(pools.admin.db, { companies: [], people, memberships: [] });
      await unseed(pools.admin.db, fixture);
      await pools.close();
    }
  });

  it('a bound subject signs in and the account count is unchanged', async () => {
    const reply = await google({ idToken: token(linked.googleSubject ?? '') });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.actor?.userId).toBe(linked.userId);
    expect(await accountsAt(linked.phoneE164)).toBe(1);
    expect(await holdersOf(linked.googleSubject ?? '')).toBe(1);
  });

  it('unbound without link answers LOGIN_NOT_LINKED', async () => {
    const reply = await google({ idToken: token(aSubject('stranger')) });
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('LOGIN_NOT_LINKED');
  });

  it('a link binds to the existing account', async () => {
    const subject = aSubject('priya');
    const reply = await linking(subject, unlinkedCode);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.actor?.userId).toBe(unlinked.userId);
    expect(await subjectOf(unlinked)).toBe(subject);
    expect(await accountsAt(unlinked.phoneE164)).toBe(1);
    expect((await challengeRow(unlinkedCode))?.verifiedAt).not.toBeNull();
  });

  it('a link to a new number creates one account', async () => {
    const subject = aSubject('fresh');
    expect(await accountsAt(freshPhone)).toBe(0);
    const reply = await linking(subject, freshCode);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(await accountsAt(freshPhone)).toBe(1);
    expect(await subjectOf({ phoneE164: freshPhone })).toBe(subject);
  });

  it("a link writes an auth_identity row whose provider is the path's", async () => {
    const subject = aSubject('row');
    const reply = await linking(subject, rowCode);
    expect(reply.status).toBe(HttpStatus.OK);
    const rows = await pools.admin.db
      .select({ provider: authIdentity.provider, userAccountId: authIdentity.userAccountId })
      .from(authIdentity)
      .where(eq(authIdentity.subject, subject));
    expect(rows).toEqual([{ provider: 'google', userAccountId: reply.body.actor?.userId }]);
  });

  it('a bound subject linking another phone is refused', async () => {
    const reply = await linking(linked.googleSubject ?? '', otherPhoneCode);
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('LOGIN_LINKED_ELSEWHERE');
    expect((await challengeRow(otherPhoneCode))?.verifiedAt).toBeNull();
  });

  it('an unbound subject with a wrong code binds nothing', async () => {
    const reply = await linking(aSubject('wrong'), wrongCode, WRONG);
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error?.code).toBe('OTP_MISMATCH');
    expect(await subjectOf(misses)).toBeNull();
    expect((await challengeRow(wrongCode))?.failedVerifies).toBe(1);
  });

  it('an expired code binds nothing', async () => {
    const reply = await linking(aSubject('expired'), expiredCode);
    expect(reply.body.error?.code).toBe('OTP_EXPIRED');
    expect(await subjectOf(misses)).toBeNull();
  });

  it('a spent code binds nothing', async () => {
    const reply = await linking(aSubject('spent'), spentCode);
    expect(reply.body.error?.code).toBe('OTP_INVALIDATED');
    expect(await subjectOf(misses)).toBeNull();
  });

  it('the fifth wrong code through the Google door answers OTP_INVALIDATED', async () => {
    const reply = await linking(aSubject('fifth'), lastMissCode, WRONG);
    expect(reply.body.error?.code).toBe('OTP_INVALIDATED');
    expect((await challengeRow(lastMissCode))?.invalidatedAt).not.toBeNull();
  });

  it('a wrong code on a taken phone answers OTP_MISMATCH, not LOGIN_PHONE_TAKEN', async () => {
    const reply = await linking(aSubject('prober'), takenWrongCode, WRONG);
    expect(reply.body.error?.code).toBe('OTP_MISMATCH');
    expect((await challengeRow(takenWrongCode))?.failedVerifies).toBe(1);
  });

  it('phone taken leaves the code usable by /auth/otp/verify', async () => {
    const reply = await linking(aSubject('second'), takenCode);
    expect(reply.status).toBe(HttpStatus.CONFLICT);
    expect(reply.body.error?.code).toBe('LOGIN_PHONE_TAKEN');
    expect(await subjectOf(taken)).toBe(taken.googleSubject);
    const byNumber = await http.callAnonymously<Answer>('POST', '/auth/otp/verify', {
      challengeId: takenCode.challengeId,
      code: CODE,
      platform: 'web',
    });
    expect(byNumber.status).toBe(HttpStatus.OK);
    expect(byNumber.body.actor?.userId).toBe(taken.userId);
  });

  it("a locked phone's bound subject signs in while /auth/otp/request answers 429", async () => {
    const request = await http.callAnonymously<Answer>('POST', '/auth/otp/request', {
      phoneE164: locked.phoneE164,
      channel: 'sms',
    });
    expect(request.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(request.body.error?.code).toBe('OTP_LOCKED');
    const reply = await google({ idToken: token(locked.googleSubject ?? '') });
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.actor?.userId).toBe(locked.userId);
  });

  it('a Google sign-in on a device carrying another session ends it', async () => {
    const reply = await google(
      { idToken: token(handedOver.googleSubject ?? '') },
      { cookie: `${SESSION_COOKIE}=${lastUserDevice.secret}` },
    );
    expect(reply.status).toBe(HttpStatus.OK);
    const [previous] = await pools.admin.db
      .select({ revokedAt: session.revokedAt })
      .from(session)
      .where(eq(session.id, lastUserDevice.sessionId));
    expect(previous?.revokedAt).not.toBeNull();
  });

  it('a repeated link after a lost answer signs in, binding nothing new', async () => {
    const subject = aSubject('retry');
    expect((await linking(subject, retriedCode)).status).toBe(HttpStatus.OK);
    const again = await linking(subject, retriedCode);
    expect(again.status).toBe(HttpStatus.OK);
    expect(again.body.actor?.userId).toBe(retried.userId);
    expect(await accountsAt(retried.phoneE164)).toBe(1);
    expect(await holdersOf(subject)).toBe(1);
  });
});
