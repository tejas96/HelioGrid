import type { PlatformKind, ProviderSignIn, SessionProjection } from '@heliogrid/contracts';
import {
  type GoogleOutcome,
  type GoogleToken,
  type OtpRequestOutcome,
  type OtpVerifyOutcome,
  type SessionUser,
  uiLanguageOrSource,
} from '@heliogrid/domain';
import { ApiError } from '../errors/errors';

/**
 * The wire's refusal codes (`packages/contracts/src/auth.ts`), each to the one word the door
 * renders a frame for. A code the wire did not name is `failed` — never guessed from a message.
 */
export const REQUEST_OUTCOME_BY_CODE: Record<string, OtpRequestOutcome> = {
  OTP_COOLDOWN: 'cooldown',
  OTP_CAPPED: 'capped',
  OTP_LOCKED: 'locked',
  OTP_DELIVERY_FAILED: 'delivery-failed',
};
export const VERIFY_OUTCOME_BY_CODE: Record<string, Exclude<OtpVerifyOutcome, 'verified'>> = {
  OTP_MISMATCH: 'mismatch',
  OTP_EXPIRED: 'expired',
  OTP_INVALIDATED: 'invalidated',
  OTP_LOCKED: 'locked',
};
/** The Google door's own refusals; every other one it answers renders the one failure frame. */
export const GOOGLE_OUTCOME_BY_CODE: Record<string, GoogleOutcome> = {
  ...VERIFY_OUTCOME_BY_CODE,
  LOGIN_NOT_LINKED: 'not-linked',
  LOGIN_PHONE_TAKEN: 'phone-taken',
};
export function codeOf(error: unknown): string {
  return error instanceof ApiError ? error.code : '';
}

/** The wire's Google request: an optional field is left out, never sent as undefined. */
export function googleSignInBody(
  token: GoogleToken,
  platform: PlatformKind,
  link: ProviderSignIn['link'],
): ProviderSignIn {
  return {
    idToken: token.idToken,
    platform,
    ...(token.nonce === null ? {} : { nonce: token.nonce }),
    ...(link === undefined ? {} : { link }),
  };
}

export function userOf(projection: SessionProjection): SessionUser {
  return {
    id: projection.actor.userId,
    name: projection.actor.displayName,
    phoneE164: projection.actor.phoneE164,
    interfaceLanguage: uiLanguageOrSource(projection.actor.interfaceLanguage),
    tenant:
      projection.membership === null
        ? null
        : { id: projection.membership.tenantId, roles: projection.membership.roles },
  };
}
