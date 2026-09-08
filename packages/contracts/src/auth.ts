import { OTP_LENGTH } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { otpChannelSchema, phoneE164Schema, platformKindSchema, uuidSchema } from './common';
import { baseError, errorEnvelope } from './error';
import { sessionProjectionSchema } from './session';

const c = initContract();

/**
 * The front door (`M01-05`): a phone and a code, never a password. Every failure here is a
 * NAMED state the sign-in screen renders honestly (`M01-03`, `M01-04`), so each is its own
 * code rather than a base one — the wire carries the reason, the screen carries the words.
 */
export const otpRequestSchema = z.object({
  phoneE164: phoneE164Schema,
  channel: otpChannelSchema,
});
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpChallengeSchema = z.object({
  challengeId: uuidSchema,
  /** When the resend control unlocks; a policy duration the screen counts down, never a clock it shows. */
  resendAvailableAt: z.string().datetime(),
});
export type OtpChallenge = z.infer<typeof otpChallengeSchema>;

/** Why a request was refused. The cap, the cooldown or the lock — each shown as its own state. */
export const otpRequestRefusalSchema = z.enum(['OTP_COOLDOWN', 'OTP_CAPPED', 'OTP_LOCKED']);
export type OtpRequestRefusal = z.infer<typeof otpRequestRefusalSchema>;

export const otpVerifySchema = z.object({
  challengeId: uuidSchema,
  code: z.string().regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), `${OTP_LENGTH} digits`),
  /** Which platform the session opens on; the lifetime rules differ (`M01-07`). */
  platform: platformKindSchema,
});
export type OtpVerify = z.infer<typeof otpVerifySchema>;

/** Why a verify was refused: wrong, expired, used up after the fifth miss, or the phone is locked. */
export const otpVerifyRefusalSchema = z.enum([
  'OTP_MISMATCH',
  'OTP_EXPIRED',
  'OTP_INVALIDATED',
  'OTP_LOCKED',
]);
export type OtpVerifyRefusal = z.infer<typeof otpVerifyRefusalSchema>;

export const refreshSchema = z.object({
  /**
   * Whether this call is foreground authenticated use. Only a foreground call restarts a mobile
   * session's idle window; background refresh, push handling and scheduled work say `false`
   * (`M01-07`). Web always says `true`: a browser tab is a person.
   */
  foreground: z.boolean(),
});

export const tokenLifeSchema = z.object({
  /** When the API token set alongside this response stops being accepted. */
  tokenExpiresAt: z.string().datetime(),
});

export const authContract = c.router({
  requestOtp: {
    method: 'POST',
    path: '/auth/otp/request',
    body: otpRequestSchema,
    summary:
      'Send a sign-in code to a phone — the send, the resend and the user-initiated voice option',
    responses: {
      200: otpChallengeSchema,
      /** A number no authored market's allowlist covers (`F1-49`). */
      422: errorEnvelope(baseError('DOMAIN_RULE_VIOLATION')),
      429: errorEnvelope(otpRequestRefusalSchema),
      502: errorEnvelope(z.literal('OTP_DELIVERY_FAILED')),
    },
  },
  verifyOtp: {
    method: 'POST',
    path: '/auth/otp/verify',
    body: otpVerifySchema,
    summary: 'Verify a code — the session, with or without a company yet',
    responses: {
      200: sessionProjectionSchema,
      401: errorEnvelope(otpVerifyRefusalSchema),
      404: errorEnvelope(baseError('NOT_FOUND')),
      429: errorEnvelope(z.literal('OTP_LOCKED')),
    },
  },
  refresh: {
    method: 'POST',
    path: '/auth/refresh',
    body: refreshSchema,
    summary: 'Renew the ten-minute API token while the session is valid',
    responses: {
      200: tokenLifeSchema,
      401: errorEnvelope(baseError('UNAUTHENTICATED')),
    },
  },
  signOut: {
    method: 'POST',
    path: '/auth/sign-out',
    body: c.noBody(),
    summary: 'End this device’s session',
    responses: {
      204: c.noBody(),
      401: errorEnvelope(baseError('UNAUTHENTICATED')),
    },
  },
  signOutEverywhere: {
    method: 'POST',
    path: '/auth/sign-out-everywhere',
    body: c.noBody(),
    summary: 'End every device’s session for the actor, within one token life',
    responses: {
      204: c.noBody(),
      401: errorEnvelope(baseError('UNAUTHENTICATED')),
    },
  },
  session: {
    method: 'GET',
    path: '/auth/session',
    summary: 'The current session as the projection every screen sees',
    responses: {
      200: sessionProjectionSchema,
      401: errorEnvelope(baseError('UNAUTHENTICATED')),
    },
  },
});
