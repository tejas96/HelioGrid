import { describe, expect, it } from 'vitest';
import {
  type InvitationStatus,
  invitationExpiresAt,
  invitationStatus,
  invitationsSince,
  inviteCapReached,
  inviteLandingPath,
} from '../../src/auth/invitation-policy';

const NOW = Date.UTC(2026, 8, 9, 9, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe('invitationExpiresAt — seven days from the send (M01-12)', () => {
  it('runs out exactly seven days after the send', () => {
    expect(invitationExpiresAt(NOW)).toBe(NOW + 7 * DAY);
  });
});

describe('invitationStatus — what an invitation is NOW (M01-12)', () => {
  it.each([
    { status: 'pending', at: NOW - 1, expected: 'pending' },
    { status: 'pending', at: NOW, expected: 'expired' },
    { status: 'pending', at: NOW + DAY, expected: 'expired' },
    { status: 'accepted', at: NOW + DAY, expected: 'accepted' },
    { status: 'declined', at: NOW + DAY, expected: 'declined' },
    { status: 'revoked', at: NOW + DAY, expected: 'revoked' },
  ] as const)(
    'reads a $status invitation at expiry$at as $expected',
    ({ status, at, expected }) => {
      expect(invitationStatus({ status: status as InvitationStatus, expiresAt: NOW }, at)).toBe(
        expected,
      );
    },
  );
});

describe('inviteCapReached — the per-tenant daily cap (M01-04)', () => {
  it.each([
    { sent: 0, reached: false },
    { sent: 49, reached: false },
    { sent: 50, reached: true },
    { sent: 51, reached: true },
  ])('with $sent sends in the window answers $reached', ({ sent, reached }) => {
    expect(inviteCapReached(sent)).toBe(reached);
  });

  it('counts every send in the last day and nothing older', () => {
    expect(invitationsSince(NOW)).toBe(NOW - DAY);
  });
});

describe('inviteLandingPath — where the link lands (M01-13)', () => {
  it('carries the token once, under the one landing path', () => {
    expect(inviteLandingPath('abc123')).toBe('/invite/abc123');
  });
});
