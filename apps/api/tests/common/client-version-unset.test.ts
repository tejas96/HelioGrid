import { CLIENT_VERSION_HEADER } from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readMinimumClientVersion } from '../../src/common/client-version';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * The api with NO minimum phone version — the default (`F4-36`). Cleared in a hoisted block,
 * because `.env.local` may set one and `ENV` is frozen at import.
 */
vi.hoisted(() => {
  vi.stubEnv('MOBILE_MIN_VERSION', undefined);
  vi.stubEnv('MOBILE_STORE_URL_IOS', undefined);
  vi.stubEnv('MOBILE_STORE_URL_ANDROID', undefined);
});

const STORE_URLS = {
  MOBILE_STORE_URL_IOS: 'https://apps.apple.com/app/id1111111111',
  MOBILE_STORE_URL_ANDROID: 'https://play.google.com/store/apps/details?id=com.heliogrid.app',
};

describe('readMinimumClientVersion — what the boot makes of the configured minimum', () => {
  it.each([
    { settings: { MOBILE_MIN_VERSION: '1.10' }, key: 'MOBILE_STORE_URL_IOS' },
    {
      settings: {
        MOBILE_MIN_VERSION: '1.10',
        MOBILE_STORE_URL_IOS: STORE_URLS.MOBILE_STORE_URL_IOS,
      },
      key: 'MOBILE_STORE_URL_ANDROID',
    },
    {
      settings: {
        MOBILE_MIN_VERSION: '1.10',
        MOBILE_STORE_URL_ANDROID: STORE_URLS.MOBILE_STORE_URL_ANDROID,
      },
      key: 'MOBILE_STORE_URL_IOS',
    },
  ])(
    'a minimum without both store links stops the boot, naming the missing key',
    ({ settings, key }) => {
      expect(() => readMinimumClientVersion(settings)).toThrow(key);
    },
  );

  it('store links without a minimum refuse nothing', () => {
    expect(readMinimumClientVersion(STORE_URLS)).toBeNull();
  });

  it.each(['one', '1.10-beta', '1.10.3.4'])(
    'a malformed minimum stops the boot, naming the key',
    (minimum) => {
      expect(() =>
        readMinimumClientVersion({ MOBILE_MIN_VERSION: minimum, ...STORE_URLS }),
      ).toThrow(/MOBILE_MIN_VERSION/);
    },
  );
});

const skip = skipWithoutHarness(
  'NO-MINIMUM PROOF',
  'A phone is UNPROVEN to be served when no minimum is set in this run.',
);
describe.skipIf(skip)('the api with no minimum phone version', () => {
  let http: Http;

  beforeAll(async () => {
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    vi.unstubAllEnvs();
  });

  it('with no minimum a 1.0 client is served', async () => {
    const reply = await http.call('GET', '/auth/session', undefined, {
      [CLIENT_VERSION_HEADER]: '1.0',
    });
    expect(reply.status).toBe(HttpStatus.OK);
  });
});
