import { userAccount } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aChallenge,
  aPerson,
  aPhone,
  type Challenge,
  type Fixture,
  openPools,
  seed,
  skipWithoutDatabase,
  unseed,
} from '../support/fixture';
import { bootHttp, type Http } from '../support/http';

/**
 * A new account's language on the WIRE (`F3-03`): the account a verified code makes is stored in
 * the language its request names — the door's — and an account that exists keeps its own
 * (`F3-02`). Each phone is seeded with its own code request: the development numbers already
 * hold accounts.
 */

const CODE = '482913';
const PATH = '/auth/otp/verify';

interface Answer {
  readonly actor?: { readonly interfaceLanguage: string };
}

const returning = aPerson('Asha Patil');
const hindiDoor = aChallenge(aPhone(), CODE);
const tamilDoor = aChallenge(aPhone(), CODE);
const silentDoor = aChallenge(aPhone(), CODE);
const returningDoor = aChallenge(returning.phoneE164, CODE);
const newNumbers = [hindiDoor, tamilDoor, silentDoor];

const fixture: Fixture = {
  companies: [],
  people: [returning],
  memberships: [],
  challenges: [...newNumbers, returningDoor],
};

const skip = skipWithoutDatabase(
  'ACCOUNT LANGUAGE WIRE PROOF',
  'A new account taking its door’s language is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('a new account’s language, over HTTP', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;

  const verifyUnder = (challenge: Challenge, acceptLanguage?: string) =>
    http.callAnonymously<Answer>(
      'POST',
      PATH,
      { challengeId: challenge.challengeId, code: CODE, platform: 'web' },
      acceptLanguage === undefined ? undefined : { 'accept-language': acceptLanguage },
    );

  beforeAll(async () => {
    pools = openPools();
    await unseed(pools.admin.db, fixture);
    await seed(pools.admin.db, fixture);
    http = await bootHttp();
  });

  afterAll(async () => {
    await http?.close();
    if (pools) {
      // The accounts the three new numbers made are the api's, so they are found by their phones.
      const made = await pools.admin.db
        .select({ userId: userAccount.id, phoneE164: userAccount.phoneE164 })
        .from(userAccount)
        .where(
          inArray(
            userAccount.phoneE164,
            newNumbers.map((challenge) => challenge.phoneE164),
          ),
        );
      const people = made.map((row) => ({ ...row, name: '' }));
      await unseed(pools.admin.db, { companies: [], people, memberships: [] });
      await unseed(pools.admin.db, fixture);
      await pools.close();
    }
  });

  it.each([
    ['a Hindi door', hindiDoor, 'hi-IN,hi;q=0.9,en;q=0.8', 'hi'],
    ['a door in a language outside the set', tamilDoor, 'ta-IN,ta;q=0.9', 'en'],
    ['a request that names no language', silentDoor, undefined, 'en'],
  ] as const)(
    'a new number verified at %s is stored in its language',
    async (_door, challenge, header, language) => {
      const reply = await verifyUnder(challenge, header);
      expect(reply.status).toBe(HttpStatus.OK);
      expect(reply.body.actor?.interfaceLanguage).toBe(language);
    },
  );

  it('an account that exists keeps its own language at a Hindi door', async () => {
    const reply = await verifyUnder(returningDoor, 'hi-IN');
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.actor?.interfaceLanguage).toBe('en');
  });
});
