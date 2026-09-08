import { describe, expect, it } from 'vitest';
import {
  apiTokenExpiresAt,
  isSessionLive,
  refreshedExpiry,
  sessionExpiresAt,
} from '../../src/auth/session-policy';

const NOW = Date.UTC(2026, 8, 8, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;

describe('sessionExpiresAt — a new session’s window per platform (M01-07)', () => {
  it.each([
    { kind: 'web', days: 30 },
    { kind: 'mobile', days: 7 },
  ] as const)('$kind opens a $days-day window', ({ kind, days }) => {
    expect(sessionExpiresAt(kind, NOW)).toBe(NOW + days * DAY);
  });
});

describe('refreshedExpiry — what a use moves (M01-07)', () => {
  it('rolls a web session on any use, foreground or not', () => {
    expect(refreshedExpiry('web', NOW, true)).toBe(NOW + 30 * DAY);
    expect(refreshedExpiry('web', NOW, false)).toBe(NOW + 30 * DAY);
  });

  it('restarts a mobile window on foreground use only', () => {
    expect(refreshedExpiry('mobile', NOW, true)).toBe(NOW + 7 * DAY);
  });

  it('leaves a mobile window untouched by background work', () => {
    expect(refreshedExpiry('mobile', NOW, false)).toBeNull();
  });
});

describe('apiTokenExpiresAt — the revocation bound (M01-07)', () => {
  it('lives ten minutes', () => {
    expect(apiTokenExpiresAt(NOW)).toBe(NOW + 10 * MINUTE);
  });
});

describe('isSessionLive — until expiry, unless revoked', () => {
  it.each([
    { at: NOW - 1, revokedAt: null, live: true, why: 'a millisecond before expiry is live' },
    { at: NOW, revokedAt: null, live: false, why: 'at expiry it is over' },
    {
      at: NOW - DAY,
      revokedAt: NOW - 2 * DAY,
      live: false,
      why: 'revoked beats an unexpired window',
    },
  ])('$why', ({ at, revokedAt, live }) => {
    expect(isSessionLive({ expiresAt: NOW, revokedAt }, at)).toBe(live);
  });
});
