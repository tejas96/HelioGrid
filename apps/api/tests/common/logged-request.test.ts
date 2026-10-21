import { describe, expect, it } from 'vitest';
import { loggedPath, loggedRequest } from '../../src/common/logging';

/**
 * A logged request line carries the path a reader debugs from and never a secret it holds: the
 * query string is dropped (its fields stay redactable in `query`), and the invite link's token —
 * the key to a stranger's invite — is censored wherever the path carries it.
 */
const TOKEN = 'the-invite-link-token-in-this-test';

describe('loggedRequest', () => {
  it.each([
    [`/invitations/landing/${TOKEN}`, '/invitations/landing/[redacted]'],
    [`/invitations/landing/${TOKEN}/accept`, '/invitations/landing/[redacted]/accept'],
    [`/invitations/landing/${TOKEN}/decline`, '/invitations/landing/[redacted]/decline'],
    [
      `/invitations/landing/${TOKEN}/request-reinvite`,
      '/invitations/landing/[redacted]/request-reinvite',
    ],
    ['/auth/otp/request?phone=%2B919999999901', '/auth/otp/request'],
    [
      '/invitations/0190aa00-0000-7000-8000-000000000000/revoke',
      '/invitations/0190aa00-0000-7000-8000-000000000000/revoke',
    ],
    ['/health', '/health'],
    [`/Invitations/Landing/${TOKEN}/decline`, '/Invitations/Landing/[redacted]/decline'],
  ])('logs %s as %s', (url, logged) => {
    expect(loggedRequest({ url, params: { path: url.split('/') } }).url).toBe(logged);
  });

  it('keeps no route parameters, which repeat the path the url already names', () => {
    const line = loggedRequest({
      url: `/invitations/landing/${TOKEN}/decline`,
      params: { path: ['invitations', 'landing', TOKEN, 'decline'] },
    });
    expect(JSON.stringify(line)).not.toContain(TOKEN);
  });

  it('loggedPath drops the query and censors the token', () => {
    expect(loggedPath(`/invitations/landing/${TOKEN}?from=sms`)).toBe(
      '/invitations/landing/[redacted]',
    );
  });
});
