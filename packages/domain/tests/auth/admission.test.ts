import { describe, expect, it } from 'vitest';
import { admit, refreshVerdict } from '../../src/auth/admission';

describe('admit — a token is compared, never trusted for its remaining life (M01-07, F2-17)', () => {
  it.each([
    {
      membership: null,
      outcome: { admitted: false, reason: 'no-membership' },
      why: 'no membership under this tenant',
    },
    {
      membership: { status: 'invited', authorizationVersion: 3 },
      outcome: { admitted: false, reason: 'not-active' },
      why: 'an invited membership has not accepted',
    },
    {
      membership: { status: 'deactivated', authorizationVersion: 3 },
      outcome: { admitted: false, reason: 'not-active' },
      why: 'a deactivated membership is out within one token life',
    },
    {
      membership: { status: 'active', authorizationVersion: 4 },
      outcome: { admitted: false, reason: 'stale-claims' },
      why: 'a role changed since the token was minted',
    },
    {
      membership: { status: 'active', authorizationVersion: 3 },
      outcome: { admitted: true },
      why: 'the claims still hold',
    },
  ] as const)('$why', ({ membership, outcome }) => {
    expect(admit({ authorizationVersion: 3 }, membership)).toEqual(outcome);
  });
});

describe('refreshVerdict — the server names why a session cannot renew (M01-07, S1.wrong.4)', () => {
  const NOW = 1_000_000;
  const live = { expiresAt: NOW + 1, revokedAt: null };
  const revoked = { expiresAt: NOW + 1, revokedAt: NOW - 1 };
  const expired = { expiresAt: NOW, revokedAt: null };

  it.each([
    { life: live, status: 'deactivated' },
    { life: revoked, status: 'deactivated' },
    { life: expired, status: 'deactivated' },
  ] as const)(
    "refreshVerdict answers access removed for a deactivated membership whatever the session's life",
    ({ life, status }) => {
      expect(refreshVerdict(life, { status }, NOW)).toBe('access-removed');
    },
  );

  it.each([
    { life: revoked, membership: { status: 'active' }, why: 'revoked, still active' },
    {
      life: expired,
      membership: { status: 'active' },
      why: 'expired at this instant, still active',
    },
    { life: revoked, membership: null, why: 'revoked, acting for no company' },
    { life: expired, membership: { status: 'invited' }, why: 'expired, an invited membership' },
  ] as const)(
    'refreshVerdict answers signed out for a revoked or expired session whose membership is active',
    ({ life, membership }) => {
      expect(refreshVerdict(life, membership, NOW)).toBe('signed-out');
    },
  );

  it.each([
    { membership: { status: 'active' }, why: 'an active membership' },
    { membership: null, why: 'no company yet — the signup that resumes at the company step' },
  ] as const)('renews a live session — $why', ({ membership }) => {
    expect(refreshVerdict(live, membership, NOW)).toBe('renew');
  });
});
