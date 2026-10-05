import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The Google door with no client ids (`M01-02`): every token is refused. The test double stays
 * bound, and it WOULD accept the token below — so only the service's own check can answer 401.
 * The api's env is frozen on load, so this file hands it the real one with the ids removed.
 */
vi.mock('../../src/config/env', async (original) => {
  const real = (await original()) as { ENV: Record<string, unknown> };
  return { ENV: { ...real.ENV, GOOGLE_CLIENT_IDS: undefined } };
});

import { skipWithoutDatabase } from '../support/fixture';
import { GOOGLE_SIGN_IN } from '../support/google';
import { bootHttp, type Http } from '../support/http';

interface Answer {
  readonly error?: { readonly code: string };
}

const skip = skipWithoutDatabase(
  'GOOGLE DOOR WITHOUT CLIENT IDS',
  'That the door refuses every token with no client ids is UNPROVEN in this run.',
);

describe.skipIf(skip)('the Google door with no client ids, over HTTP', () => {
  let http: Http;

  beforeAll(async () => {
    http = await bootHttp();
  });

  afterAll(async () => {
    await http?.close();
  });

  it('no client ids answers 401', async () => {
    const reply = await http.callAnonymously<Answer>('POST', GOOGLE_SIGN_IN, {
      idToken: 'test-google:anyone',
      platform: 'web',
    });
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(reply.body.error?.code).toBe('LOGIN_TOKEN_REFUSED');
  });
});
