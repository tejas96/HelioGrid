import { randomUUID } from 'node:crypto';
import { otpChallenge, userAccount } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { and, count, inArray, isNotNull, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TEST_GOOGLE_UNAVAILABLE } from '../../src/modules/auth/internal/google-identity.test-double';
import {
  aChallenge,
  aPerson,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import {
  aSubject,
  GOOGLE_CODE as CODE,
  callGoogle,
  linkGoogle,
  subjectAt,
  googleToken as token,
} from '../support/google';
import { holdLock } from '../support/held-lock';
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
 * The Google door's edges (`M01-02`). Two links racing: two logins onto one phone keep the first,
 * never overwrite it; one login onto two phones lands on one — each race FORCED, both requests
 * waiting on a held row lock until both are seen waiting, and the loser's code left unspent. And
 * the refusals before any account is read: a nonce, Google unreachable, an unknown challenge.
 */

const racedPhone = aPerson('Raced Phone');
const racedOne = aPerson('Raced One');
const racedTwo = aPerson('Raced Two');
const racedPhoneCodes = [
  aChallenge(racedPhone.phoneE164, CODE),
  aChallenge(racedPhone.phoneE164, CODE),
];
const racedOneCode = aChallenge(racedOne.phoneE164, CODE);
const racedTwoCode = aChallenge(racedTwo.phoneE164, CODE);

const fixture: Fixture = {
  companies: [],
  people: [racedPhone, racedOne, racedTwo],
  memberships: [],
  challenges: [...racedPhoneCodes, racedOneCode, racedTwoCode],
};

const skip = skipWithoutDatabase(
  'GOOGLE SIGN-IN EDGES PROOF',
  'The raced links and the early refusals are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)("the Google door's edges, over HTTP", () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  const google = (body: Record<string, unknown>) => callGoogle(http, body);

  beforeAll(async () => {
    pools = openPools();
    await unseed(pools.admin.db, fixture);
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http?.close();
    if (pools) {
      await unseed(pools.admin.db, fixture);
      await pools.close();
    }
  });

  it('two subjects racing onto one phone: one 200, one 409', async () => {
    const lock = await holdLock(
      sql`select id from ${userAccount} where ${userAccount.id} = ${racedPhone.userId} for update`,
    );
    const [first, second] = racedPhoneCodes;
    if (!first || !second) throw new Error('two codes are seeded for the raced phone');
    const both = Promise.all([
      linkGoogle(http, aSubject('race-a'), first),
      linkGoogle(http, aSubject('race-b'), second),
    ]);
    await lock.waitForWaiters(2);
    await lock.release();
    const statuses = (await both).map((reply) => reply.status).sort();
    expect(statuses).toEqual([HttpStatus.OK, HttpStatus.CONFLICT]);
    const loser = (await both).find((reply) => reply.status === HttpStatus.CONFLICT);
    expect(loser?.body.error?.code).toBe('LOGIN_PHONE_TAKEN');
    // The loser's code is left unspent: only the winner's claim survived its transaction.
    const [spent] = await pools.admin.db
      .select({ n: count() })
      .from(otpChallenge)
      .where(
        and(
          inArray(otpChallenge.id, [first.challengeId, second.challengeId]),
          isNotNull(otpChallenge.verifiedAt),
        ),
      );
    expect(spent?.n).toBe(1);
  });

  it('one subject racing onto two phones: one 200, one 409', async () => {
    const subject = aSubject('race-two-phones');
    const lock = await holdLock(
      sql`select id from ${userAccount} where ${userAccount.id} in (${racedOne.userId}, ${racedTwo.userId}) for update`,
    );
    const both = Promise.all([
      linkGoogle(http, subject, racedOneCode),
      linkGoogle(http, subject, racedTwoCode),
    ]);
    await lock.waitForWaiters(2);
    await lock.release();
    const replies = await both;
    expect(replies.map((reply) => reply.status).sort()).toEqual([
      HttpStatus.OK,
      HttpStatus.CONFLICT,
    ]);
    expect(replies.find((reply) => reply.status === HttpStatus.CONFLICT)?.body.error?.code).toBe(
      'LOGIN_LINKED_ELSEWHERE',
    );
    const holders = [
      await subjectAt(pools.admin.db, racedOne.phoneE164),
      await subjectAt(pools.admin.db, racedTwo.phoneE164),
    ].filter((held) => held === subject);
    expect(holders).toHaveLength(1);
  });

  it('a nonce that does not match is refused', async () => {
    const reply = await google({
      idToken: token(aSubject('nonce'), 'sent-by-google'),
      nonce: 'sent-by-device',
    });
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error?.code).toBe('LOGIN_TOKEN_REFUSED');
  });

  it('a key-fetch failure answers unavailable', async () => {
    const reply = await google({ idToken: TEST_GOOGLE_UNAVAILABLE });
    expect(reply.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(reply.body.error?.code).toBe('LOGIN_PROVIDER_UNAVAILABLE');
  });

  it('an unknown provider answers 400', async () => {
    const reply = await http.callAnonymously<{ error?: { code: string } }>(
      'POST',
      '/auth/sign-in/apple',
      { idToken: token(aSubject('apple')), platform: 'web' },
    );
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('the old /auth/google answers 404', async () => {
    const reply = await http.callAnonymously<{ error?: { code: string } }>('POST', '/auth/google', {
      idToken: token(aSubject('old')),
      platform: 'web',
    });
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('an unknown challenge id answers 404', async () => {
    const reply = await google({
      idToken: token(aSubject('lost')),
      link: { challengeId: randomUUID(), code: CODE },
    });
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });
});
