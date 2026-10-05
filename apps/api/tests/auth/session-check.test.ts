import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SESSION_COOKIE } from '../../src/common/auth/cookies';
import { skipWithoutDatabase } from '../support/fixture';
import { bootHttp, type Http } from '../support/http';

/**
 * The boot check, on the WIRE (`D104`): a visitor carrying no credential is answered "signed out"
 * with a 200, so a signed-out page logs no error; a credential that did not work is still a 401,
 * because it is worth one refresh; a live session answers its projection.
 */

const PATH = '/auth/session';

interface Answer {
  readonly signedIn?: boolean;
  readonly actor?: { readonly userId: string };
  readonly error?: { readonly code: string };
}

const skip = skipWithoutDatabase(
  'SESSION-CHECK WIRE PROOF',
  'The signed-out boot check is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the boot check, over HTTP', () => {
  let http: Http;

  beforeAll(async () => {
    http = await bootHttp();
  });

  afterAll(async () => {
    await http?.close();
  });

  it('a visitor with no credential is answered signed out, with a 200', async () => {
    const reply = await http.callAnonymously<Answer>('GET', PATH);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body).toEqual({ signedIn: false });
  });

  it('a credential that does not work is still a 401', async () => {
    const reply = await http.callAnonymously<Answer>('GET', PATH, undefined, {
      cookie: `${SESSION_COOKIE}=not-a-session`,
    });
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('a live session answers its projection', async () => {
    const signedIn = await http.signIn();
    const reply = await http.call<Answer>('GET', PATH);
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.actor?.userId).toBe(signedIn.actor.userId);
  });
});
