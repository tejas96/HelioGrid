import { describe, expect, it } from 'vitest';
import {
  type OtpHistory,
  otpExpiresAt,
  otpHistorySince,
  otpLockedUntil,
  otpRequestDecision,
  otpVerifyDecision,
} from '../../src/auth/otp-policy';

const NOW = Date.UTC(2026, 8, 8, 9, 0, 0);
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const quiet: OtpHistory = {
  requestedAt: [],
  lastDeliveryFailed: false,
  consecutiveInvalidations: 0,
  lastInvalidatedAt: null,
};

function history(overrides: Partial<OtpHistory>): OtpHistory {
  return { ...quiet, ...overrides };
}

describe('otpRequestDecision — may this phone ask for a code now? (M01-03, M01-04)', () => {
  it('allows a quiet phone and names when resend unlocks', () => {
    expect(otpRequestDecision(quiet, NOW)).toEqual({
      kind: 'allowed',
      resendAvailableAt: NOW + 30 * SECOND,
    });
  });

  it('holds the 30-second cooldown after a request, to the second', () => {
    const justAsked = history({ requestedAt: [NOW - 29 * SECOND] });
    expect(otpRequestDecision(justAsked, NOW)).toEqual({ kind: 'cooldown', until: NOW + SECOND });
    const cooled = history({ requestedAt: [NOW - 30 * SECOND] });
    expect(otpRequestDecision(cooled, NOW).kind).toBe('allowed');
  });

  it('releases the cooldown after a confirmed hard delivery failure, and nothing else', () => {
    const failed = history({ requestedAt: [NOW - 5 * SECOND], lastDeliveryFailed: true });
    expect(otpRequestDecision(failed, NOW).kind).toBe('allowed');
  });

  it('caps at three requests in fifteen minutes, until the oldest leaves the window', () => {
    const three = history({
      requestedAt: [NOW - 14 * MINUTE, NOW - 5 * MINUTE, NOW - 40 * SECOND],
    });
    expect(otpRequestDecision(three, NOW)).toEqual({
      kind: 'capped',
      window: 'fifteen-minutes',
      until: NOW + MINUTE,
    });
    const twoInWindow = history({
      requestedAt: [NOW - 16 * MINUTE, NOW - 5 * MINUTE, NOW - 40 * SECOND],
    });
    expect(otpRequestDecision(twoInWindow, NOW).kind).toBe('allowed');
  });

  it('caps at eight requests a day, spaced past every shorter limit', () => {
    const eight = history({
      requestedAt: Array.from({ length: 8 }, (_, i) => NOW - (23 * HOUR - i * HOUR)),
    });
    expect(otpRequestDecision(eight, NOW)).toEqual({
      kind: 'capped',
      window: 'day',
      until: NOW - 23 * HOUR + 24 * HOUR,
    });
  });

  it('lets a cap already reached govern over a delivery failure and a cooldown', () => {
    const cappedAndFailed = history({
      requestedAt: [NOW - 10 * MINUTE, NOW - 2 * MINUTE, NOW - 5 * SECOND],
      lastDeliveryFailed: true,
    });
    expect(otpRequestDecision(cappedAndFailed, NOW).kind).toBe('capped');
  });

  it('locks the phone for fifteen minutes after three consecutive invalidations, and lets it go after', () => {
    const locked = history({ consecutiveInvalidations: 3, lastInvalidatedAt: NOW - 14 * MINUTE });
    expect(otpRequestDecision(locked, NOW)).toEqual({ kind: 'locked', until: NOW + MINUTE });
    const released = history({ consecutiveInvalidations: 3, lastInvalidatedAt: NOW - 15 * MINUTE });
    expect(otpRequestDecision(released, NOW).kind).toBe('allowed');
    const twoOnly = history({ consecutiveInvalidations: 2, lastInvalidatedAt: NOW - MINUTE });
    expect(otpRequestDecision(twoOnly, NOW).kind).toBe('allowed');
  });

  it('reads a day of history — the longest window any cap needs', () => {
    expect(otpHistorySince(NOW)).toBe(NOW - 24 * HOUR);
  });

  it('reads no lock when the count says lock but no instant was recorded', () => {
    expect(otpLockedUntil(history({ consecutiveInvalidations: 3 }), NOW)).toBeNull();
  });
});

describe('otpVerifyDecision — what one attempt does to a code (M01-04, M01-05)', () => {
  const fresh = {
    issuedAt: NOW - MINUTE,
    failedVerifies: 0,
    verifiedAt: null,
    invalidatedAt: null,
  };

  it('verifies a matching, live, unused code', () => {
    expect(otpVerifyDecision(fresh, true, NOW, 0)).toEqual({ kind: 'verified' });
  });

  it.each([
    { state: { ...fresh, verifiedAt: NOW - 10 * SECOND }, why: 'a code already verified is spent' },
    { state: { ...fresh, invalidatedAt: NOW - 10 * SECOND }, why: 'an invalidated code is spent' },
  ])('$why', ({ state }) => {
    expect(otpVerifyDecision(state, true, NOW, 0)).toEqual({ kind: 'spent' });
  });

  it('expires at exactly five minutes, and not a millisecond before', () => {
    const issuedAt = NOW - 5 * MINUTE;
    expect(otpVerifyDecision({ ...fresh, issuedAt }, true, NOW, 0)).toEqual({ kind: 'expired' });
    expect(otpVerifyDecision({ ...fresh, issuedAt }, true, NOW - 1, 0)).toEqual({
      kind: 'verified',
    });
    expect(otpExpiresAt(issuedAt)).toBe(NOW);
  });

  it('counts a miss and says how many are left', () => {
    expect(otpVerifyDecision(fresh, false, NOW, 0)).toEqual({ kind: 'mismatch', attemptsLeft: 4 });
    expect(otpVerifyDecision({ ...fresh, failedVerifies: 3 }, false, NOW, 0)).toEqual({
      kind: 'mismatch',
      attemptsLeft: 1,
    });
  });

  it('invalidates on the fifth miss, and locks the phone on the third consecutive invalidation', () => {
    const fourMisses = { ...fresh, failedVerifies: 4 };
    expect(otpVerifyDecision(fourMisses, false, NOW, 0)).toEqual({
      kind: 'invalidated',
      lockedUntil: null,
    });
    expect(otpVerifyDecision(fourMisses, false, NOW, 1)).toEqual({
      kind: 'invalidated',
      lockedUntil: null,
    });
    expect(otpVerifyDecision(fourMisses, false, NOW, 2)).toEqual({
      kind: 'invalidated',
      lockedUntil: NOW + 15 * MINUTE,
    });
  });
});
