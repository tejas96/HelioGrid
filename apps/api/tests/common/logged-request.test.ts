import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { loggedPath, loggedRequest, pinoHttpOptions } from '../../src/common/logging';

/**
 * A logged request line carries the path a reader debugs from and never a secret it holds: the
 * query string is dropped (its fields stay redactable in `query`), and the invite link's token —
 * the key to a stranger's invite — is censored wherever the path carries it.
 */
const TOKEN = 'the-invite-link-token-in-this-test';
/** A customer link's token is the link's only credential (`F5-21`). */
const LINK_TOKEN = 'aDTz_-W-0SOV-QeCustomerLinkTokenInThisTest1';

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
    [`/customer-link/${LINK_TOKEN}`, '/customer-link/[redacted]'],
    ...[
      'opened',
      'viewed',
      'accept',
      'negotiate',
      'decline',
      'questions',
      'call-requests',
      'pdf',
    ].map((act) => [`/customer-link/${LINK_TOKEN}/${act}`, `/customer-link/[redacted]/${act}`]),
    [
      `/customer-link/${LINK_TOKEN}/files/0190aa00-0000-7000-8000-000000000000`,
      '/customer-link/[redacted]/files/0190aa00-0000-7000-8000-000000000000',
    ],
    [`/Customer-Link/${LINK_TOKEN}/accept`, '/Customer-Link/[redacted]/accept'],
    [
      '/proposal-print/0190aa00-0000-7000-8000-000000000000?grant=the-print-grant-in-this-test',
      '/proposal-print/0190aa00-0000-7000-8000-000000000000',
    ],
    // Only LOOK like a credential-bearing path: no token segment sits where the rule censors.
    ['/customer-link', '/customer-link'],
    [
      '/customer-links/0190aa00-0000-7000-8000-000000000000',
      '/customer-links/0190aa00-0000-7000-8000-000000000000',
    ],
    [
      '/leads/0190aa00-0000-7000-8000-000000000000/customer-link',
      '/leads/0190aa00-0000-7000-8000-000000000000/customer-link',
    ],
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

  it('a print read logs its version and never its grant, which alone opens the version', () => {
    const GRANT = 'the-print-grant-in-this-test';
    const written: string[] = [];
    const logger = pino(
      { redact: pinoHttpOptions.redact, serializers: pinoHttpOptions.serializers },
      { write: (line: string) => written.push(line) },
    );
    logger.info({
      req: {
        method: 'GET',
        url: `/proposal-print/0190aa00-0000-7000-8000-000000000000?grant=${GRANT}`,
        query: { grant: GRANT },
        params: { versionId: '0190aa00-0000-7000-8000-000000000000' },
        headers: {},
      },
    });
    expect(written.join('')).toContain('/proposal-print/0190aa00-0000-7000-8000-000000000000');
    expect(written.join('')).not.toContain(GRANT);
  });
});
