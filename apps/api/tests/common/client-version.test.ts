import {
  CLIENT_UPGRADE_REQUIRED_STATUS,
  CLIENT_VERSION_HEADER,
  clientUpgradeRequiredSchema,
  REQUEST_ID_HEADER,
} from '@heliogrid/contracts';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';

/**
 * The api with a minimum phone version set (`F4-36`). The environment is stubbed in a hoisted
 * block, which runs BEFORE the imports above — `ENV` is read once and frozen at import.
 */
vi.hoisted(() => {
  vi.stubEnv('MOBILE_MIN_VERSION', '1.10');
  vi.stubEnv('MOBILE_STORE_URL_IOS', 'https://apps.apple.com/app/id1111111111');
  vi.stubEnv(
    'MOBILE_STORE_URL_ANDROID',
    'https://play.google.com/store/apps/details?id=com.heliogrid.app',
  );
});

const TOO_OLD = { [CLIENT_VERSION_HEADER]: '1.0' };
/* Twice the api's 1 MiB body limit (`app.ts`), which would otherwise answer 413. */
const TWO_MEBIBYTES = 2_097_152;
const OVER_THE_BODY_LIMIT = 'x'.repeat(TWO_MEBIBYTES);

const skip = skipWithoutHarness(
  'CLIENT VERSION PROOF',
  'A phone below the minimum is UNPROVEN to be refused in this run.',
);
describe.skipIf(skip)('the api with a minimum phone version of 1.10', () => {
  let http: Http;

  beforeAll(async () => {
    http = await bootHttp();
  });

  afterAll(async () => {
    await http.close();
    vi.unstubAllEnvs();
  });

  it('the refusal names the required version and both store links', async () => {
    const reply = await http.call('GET', '/auth/session', undefined, TOO_OLD);

    expect(reply.status).toBe(CLIENT_UPGRADE_REQUIRED_STATUS);
    const refusal = clientUpgradeRequiredSchema.parse(reply.body);
    expect(refusal.error.upgrade).toEqual({
      requiredVersion: '1.10',
      storeUrls: {
        ios: 'https://apps.apple.com/app/id1111111111',
        android: 'https://play.google.com/store/apps/details?id=com.heliogrid.app',
      },
    });
    expect(refusal.error.requestId).toBe(reply.headers.get(REQUEST_ID_HEADER));
  });

  it.each([
    { sent: '1.9', status: CLIENT_UPGRADE_REQUIRED_STATUS },
    { sent: '1.10', status: HttpStatus.UNAUTHORIZED },
    { sent: '1.11', status: HttpStatus.UNAUTHORIZED },
  ])('a supported version is served', async ({ sent, status }) => {
    const reply = await http.call('GET', '/auth/session', undefined, {
      [CLIENT_VERSION_HEADER]: sent,
    });
    expect(reply.status).toBe(status);
  });

  it('a version header sent twice is unreadable', async () => {
    // biome-ignore lint/style/noRestrictedGlobals: a repeated header — which fetch and Node both carry as one comma-joined value — is what the harness's own record of headers cannot send; nothing here ships.
    const reply = await fetch(`${http.baseUrl}/auth/session`, {
      headers: [
        [CLIENT_VERSION_HEADER, '1.10'],
        [CLIENT_VERSION_HEADER, '1.10'],
      ],
    });
    expect(reply.status).toBe(CLIENT_UPGRADE_REQUIRED_STATUS);
  });

  it('a request with no client version is served', async () => {
    const reply = await http.call('GET', '/auth/session');
    expect(reply.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('a too-old client is refused before the session guard', async () => {
    const reply = await http.call('GET', '/notifications', undefined, TOO_OLD);
    expect(reply.status).toBe(CLIENT_UPGRADE_REQUIRED_STATUS);
  });

  it('a too-old client is refused before its body is read', async () => {
    const oversized = await http.call(
      'POST',
      '/auth/otp/request',
      { phoneE164: OVER_THE_BODY_LIMIT, channel: 'sms' },
      TOO_OLD,
    );
    expect(oversized.status).toBe(CLIENT_UPGRADE_REQUIRED_STATUS);

    // biome-ignore lint/style/noRestrictedGlobals: a malformed JSON body is what the harness's own JSON-encoding caller cannot send; nothing here ships.
    const malformed = await fetch(`${http.baseUrl}/auth/otp/request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...TOO_OLD },
      body: '{"phoneE164":',
    });
    expect(malformed.status).toBe(CLIENT_UPGRADE_REQUIRED_STATUS);
  });
});
