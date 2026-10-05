import { OTP_LENGTH } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  extensibleEnum,
  loginProviderSchema,
  otpChannelSchema,
  phoneE164Schema,
  platformKindSchema,
  uuidSchema,
} from './common';
import { AUTHENTICATION_CODES, baseError, errorEnvelope, unauthenticatedEnvelope } from './error';
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

/**
 * The provider door (`M01-02`): a convenience sign-in onto the SAME phone-identity account. A
 * login already linked to an account signs straight in; one that is not answers
 * `LOGIN_NOT_LINKED`, and the device runs the phone step and sends the code back in `link` — the
 * code is checked here, by the same rules as a verify, so the bind and the code's use are one act.
 * `nonce` is the value the device put in the provider's request; when sent, the token must carry it.
 */
export const providerSignInSchema = z.object({
  idToken: z.string().min(1).max(4096),
  platform: platformKindSchema,
  nonce: z.string().min(1).max(256).optional(),
  link: z
    .object({
      challengeId: uuidSchema,
      code: otpVerifySchema.shape.code,
    })
    .optional(),
});
export type ProviderSignIn = z.infer<typeof providerSignInSchema>;

/** The provider a sign-in goes through, in the path — an unknown one is a 400, never a query. */
export const providerParamsSchema = z.object({ provider: loginProviderSchema });

/**
 * Why a provider sign-in was refused, beside the verify refusals a `link` can meet:
 * - `LOGIN_NOT_LINKED` — the login is linked to no account; run the phone step.
 * - `LOGIN_PHONE_TAKEN` — that phone's account already holds another login of this provider.
 * - `LOGIN_LINKED_ELSEWHERE` — this login is linked to a different phone's account.
 */
export const loginLinkRefusalSchema = z.enum([
  'LOGIN_NOT_LINKED',
  'LOGIN_PHONE_TAKEN',
  'LOGIN_LINKED_ELSEWHERE',
]);
export type LoginLinkRefusal = z.infer<typeof loginLinkRefusalSchema>;

/** A token the provider did not sign for this app, expired, a nonce it does not carry — or no client ids set. */
export const LOGIN_TOKEN_REFUSED = 'LOGIN_TOKEN_REFUSED' as const;
/** The provider's signing keys could not be fetched; nothing was decided. */
export const LOGIN_PROVIDER_UNAVAILABLE = 'LOGIN_PROVIDER_UNAVAILABLE' as const;
/** Every code the provider door itself answers, beside the verify refusals a `link` meets. */
export type LoginRefusal =
  | LoginLinkRefusal
  | typeof LOGIN_TOKEN_REFUSED
  | typeof LOGIN_PROVIDER_UNAVAILABLE;

/**
 * The boot check's answer to a visitor carrying no credential at all: a fact, not a refusal, so
 * a signed-out page logs no error. A credential that did not work still answers 401 — it is
 * worth one refresh.
 */
export const signedOutSchema = z.object({ signedIn: z.literal(false) });

export const refreshSchema = z.object({
  /**
   * Whether this call is foreground authenticated use. Only a foreground call restarts a mobile
   * session's idle window; background refresh, push handling and scheduled work say `false`
   * (`M01-07`). Web always says `true`: a browser tab is a person.
   */
  foreground: z.boolean(),
});

/**
 * The refresh's own refusal when the session acted for a company whose membership was DEACTIVATED
 * (`M01` edge `S1.wrong.4`). Every other refusal — signed out, signed out everywhere, expired,
 * unknown — stays `UNAUTHENTICATED`, so a device says "your access was removed" only when it was.
 * A route code, not a base code: the api throws it through `ContractException`. The set stays
 * extensible, so a phone built before it reads it as any other 401 from the refresh — a loss.
 */
export const ACCESS_REMOVED = 'ACCESS_REMOVED' as const;
export const refreshRefusalEnvelope = errorEnvelope(
  extensibleEnum([...AUTHENTICATION_CODES, ACCESS_REMOVED]),
);

export const tokenLifeSchema = z.object({
  /** When the API token set alongside this response stops being accepted. */
  tokenExpiresAt: z.string().datetime(),
});

/**
 * The prefix every auth route shares, and the one fact three layers must agree on: the routes
 * below, the refresh cookie's `Path` (a cookie scoped to `/auth` is not sent to a route that
 * moved), and the transport's one refresh-and-retry, which recognises the refresh call by this
 * path. Moving the routes without moving those two stops the refresh cookie being sent at all —
 * a sign-in that survives a reload one day and does not the next. Derived below, so it cannot be
 * moved here and forgotten there.
 */
export const AUTH_PATH_PREFIX = '/auth';

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
  signInWithProvider: {
    method: 'POST',
    path: '/auth/sign-in/:provider',
    pathParams: providerParamsSchema,
    body: providerSignInSchema,
    summary:
      'Sign in through a provider — a linked login signs in; a link binds it to the phone the code proves',
    responses: {
      200: sessionProjectionSchema,
      401: errorEnvelope(z.enum([LOGIN_TOKEN_REFUSED, ...otpVerifyRefusalSchema.options])),
      404: errorEnvelope(baseError('NOT_FOUND')),
      409: errorEnvelope(loginLinkRefusalSchema),
      429: errorEnvelope(z.literal('OTP_LOCKED')),
      503: errorEnvelope(z.literal(LOGIN_PROVIDER_UNAVAILABLE)),
    },
  },
  refresh: {
    method: 'POST',
    path: '/auth/refresh',
    body: refreshSchema,
    summary: 'Renew the ten-minute API token while the session is valid',
    responses: {
      200: tokenLifeSchema,
      401: refreshRefusalEnvelope,
    },
  },
  signOut: {
    method: 'POST',
    path: '/auth/sign-out',
    body: c.noBody(),
    summary: 'End this device’s session',
    responses: {
      204: c.noBody(),
      401: unauthenticatedEnvelope,
    },
  },
  signOutEverywhere: {
    method: 'POST',
    path: '/auth/sign-out-everywhere',
    body: c.noBody(),
    summary: 'End every device’s session for the actor, within one token life',
    responses: {
      204: c.noBody(),
      401: unauthenticatedEnvelope,
    },
  },
  session: {
    method: 'GET',
    path: '/auth/session',
    summary:
      'The current session as the projection every screen sees, or signed out for a visitor carrying no credential',
    responses: {
      200: z.union([sessionProjectionSchema, signedOutSchema]),
      401: unauthenticatedEnvelope,
    },
  },
});

/* Every route above sits under the prefix; a route added outside it breaks the cookie and the
   transport rather than merely reading oddly, so the check is here and not in a review note. */
for (const [name, route] of Object.entries(authContract)) {
  if (!('path' in route) || typeof route.path !== 'string') continue;
  if (!route.path.startsWith(`${AUTH_PATH_PREFIX}/`)) {
    throw new Error(
      `auth contract: "${name}" is at ${route.path}, outside ${AUTH_PATH_PREFIX}/ — the refresh ` +
        'cookie is scoped to that prefix and the transport recognises the refresh call by it.',
    );
  }
}
