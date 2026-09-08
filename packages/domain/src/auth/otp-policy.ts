import { RESEND_SECONDS } from './login-policy';
import { OTP_EXPIRY_SECONDS } from './otp';

/**
 * The OTP anti-abuse limits (`M01-04`), product-visible and honest, as numbers and two
 * decisions. The lock is on the SMS channel, never on the account. Time is `now: number`,
 * epoch milliseconds; nothing here reads a clock or a store — the caller supplies the phone's
 * recent history and receives the state to show.
 */
export const OTP_CHANNELS = ['sms', 'voice'] as const;
export type OtpChannel = (typeof OTP_CHANNELS)[number];

/** `M01-04` — three requests per fifteen minutes per phone. */
export const OTP_REQUEST_WINDOW_MINUTES = 15;
export const OTP_REQUESTS_PER_WINDOW = 3;
/** `M01-04` — eight requests per day per phone. */
export const OTP_REQUESTS_PER_DAY = 8;
/** `M01-04` — the fifth failed verify invalidates the code. */
export const OTP_MAX_FAILED_VERIFIES = 5;
/** `M01-04` — three consecutive invalidations lock the phone. */
export const OTP_INVALIDATIONS_TO_LOCK = 3;
export const OTP_LOCK_MINUTES = 15;

const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** What a phone's recent OTP traffic looks like, as the store can answer it. */
export interface OtpHistory {
  /** Every request instant in the last day, any order. */
  readonly requestedAt: readonly number[];
  /** Whether the most recent request's delivery was a CONFIRMED hard failure (`M01-03`). */
  readonly lastDeliveryFailed: boolean;
  /** Invalidations since the last verified code, and when the latest happened. */
  readonly consecutiveInvalidations: number;
  readonly lastInvalidatedAt: number | null;
}

export type OtpRequestDecision =
  | { readonly kind: 'allowed'; readonly resendAvailableAt: number }
  | { readonly kind: 'cooldown'; readonly until: number }
  | { readonly kind: 'capped'; readonly window: 'fifteen-minutes' | 'day'; readonly until: number }
  | { readonly kind: 'locked'; readonly until: number };

/** The instant the longest window opens: everything a phone did since matters to the caps. */
export function otpHistorySince(now: number): number {
  return now - MS_PER_DAY;
}

/** When a phone's lock ends, or `null` when it holds none. */
export function otpLockedUntil(history: OtpHistory, now: number): number | null {
  if (history.consecutiveInvalidations < OTP_INVALIDATIONS_TO_LOCK) return null;
  if (history.lastInvalidatedAt === null) return null;
  const until = history.lastInvalidatedAt + OTP_LOCK_MINUTES * MS_PER_MINUTE;
  return now < until ? until : null;
}

function cappedUntil(instants: readonly number[], now: number, windowMs: number, cap: number) {
  const inWindow = instants.filter((at) => at > now - windowMs).sort((a, b) => a - b);
  const oldest = inWindow[0];
  return inWindow.length >= cap && oldest !== undefined ? oldest + windowMs : null;
}

/**
 * Whether a phone may request a code now, and if not, which honest state to show. A cap
 * already reached governs over the cooldown (`M01-04`); a confirmed hard delivery failure
 * releases the cooldown and nothing else (`M01-03`).
 */
export function otpRequestDecision(history: OtpHistory, now: number): OtpRequestDecision {
  const lockedUntil = otpLockedUntil(history, now);
  if (lockedUntil !== null) return { kind: 'locked', until: lockedUntil };
  const dayCap = cappedUntil(history.requestedAt, now, MS_PER_DAY, OTP_REQUESTS_PER_DAY);
  if (dayCap !== null) return { kind: 'capped', window: 'day', until: dayCap };
  const windowMs = OTP_REQUEST_WINDOW_MINUTES * MS_PER_MINUTE;
  const windowCap = cappedUntil(history.requestedAt, now, windowMs, OTP_REQUESTS_PER_WINDOW);
  if (windowCap !== null) return { kind: 'capped', window: 'fifteen-minutes', until: windowCap };
  const latest = Math.max(...history.requestedAt, Number.NEGATIVE_INFINITY);
  const cooldownUntil = latest + RESEND_SECONDS * MS_PER_SECOND;
  if (!history.lastDeliveryFailed && now < cooldownUntil)
    return { kind: 'cooldown', until: cooldownUntil };
  return { kind: 'allowed', resendAvailableAt: now + RESEND_SECONDS * MS_PER_SECOND };
}

/** One challenge as the store holds it, before this verify attempt is counted. */
export interface OtpChallengeState {
  readonly issuedAt: number;
  readonly failedVerifies: number;
  readonly verifiedAt: number | null;
  readonly invalidatedAt: number | null;
}

export type OtpVerifyDecision =
  | { readonly kind: 'verified' }
  | { readonly kind: 'spent' }
  | { readonly kind: 'expired' }
  | { readonly kind: 'mismatch'; readonly attemptsLeft: number }
  | { readonly kind: 'invalidated'; readonly lockedUntil: number | null };

/** When a code issued at `issuedAt` stops being acceptable. */
export function otpExpiresAt(issuedAt: number): number {
  return issuedAt + OTP_EXPIRY_SECONDS * MS_PER_SECOND;
}

/**
 * What one verify attempt does to a challenge. `matches` is the caller's constant-time compare;
 * this decides what the outcome MEANS: a spent or expired code is never re-verified, the fifth
 * miss invalidates the code, and the third consecutive invalidation locks the phone.
 */
export function otpVerifyDecision(
  challenge: OtpChallengeState,
  matches: boolean,
  now: number,
  consecutiveInvalidationsBefore: number,
): OtpVerifyDecision {
  if (challenge.verifiedAt !== null || challenge.invalidatedAt !== null) return { kind: 'spent' };
  if (now >= otpExpiresAt(challenge.issuedAt)) return { kind: 'expired' };
  if (matches) return { kind: 'verified' };
  const failed = challenge.failedVerifies + 1;
  if (failed < OTP_MAX_FAILED_VERIFIES) {
    return { kind: 'mismatch', attemptsLeft: OTP_MAX_FAILED_VERIFIES - failed };
  }
  const locks = consecutiveInvalidationsBefore + 1 >= OTP_INVALIDATIONS_TO_LOCK;
  return {
    kind: 'invalidated',
    lockedUntil: locks ? now + OTP_LOCK_MINUTES * MS_PER_MINUTE : null,
  };
}
