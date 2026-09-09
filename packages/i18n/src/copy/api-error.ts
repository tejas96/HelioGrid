import type { BaseErrorCode, InvitationErrorCode, TenantErrorCode } from '@heliogrid/contracts';

/**
 * The ONE definition of base error-code copy (foundation-dx spec §3.2), swept by the
 * Lingui extractor (lingui.config.js). Record over the contracts enum: a new base code
 * fails compile HERE, once, for both platforms. Pure data — NO React and NO @lingui/react
 * import: the platform wrappers render `<Trans id={apiErrorMessageId(code)} />` with their
 * own @lingui/react, which sidesteps the ESM/CJS dual-instance context hazard (the app's
 * I18nProvider lives in the .mjs build; a CJS <Trans> from this package cannot see it).
 * The leading i18n block-comment annotations are what the extractor keys on for non-JSX
 * message descriptors.
 */
const COPY: Record<BaseErrorCode, { id: string }> = {
  VALIDATION_FAILED: /*i18n*/ {
    id: 'Some fields need attention. Check the form and retry.',
  },
  UNAUTHENTICATED: /*i18n*/ { id: "You're signed out. Sign in to continue." },
  FORBIDDEN: /*i18n*/ { id: "You don't have access to do that." },
  ENTITLEMENT_BLOCKED: /*i18n*/ {
    id: "Your current plan doesn't include this.",
  },
  NOT_FOUND: /*i18n*/ { id: "That record isn't available." },
  CONFLICT: /*i18n*/ {
    id: 'Someone changed this while you were editing. Refresh and retry.',
  },
  DOMAIN_RULE_VIOLATION: /*i18n*/ { id: "That change isn't allowed here." },
  PAYLOAD_TOO_LARGE: /*i18n*/ {
    id: 'That request is too large. Reduce it and retry.',
  },
  RATE_LIMITED: /*i18n*/ { id: 'Too many attempts. Wait a moment and retry.' },
  INTERNAL: /*i18n*/ { id: 'Something went wrong on our side. Try again.' },
};

/**
 * Route codes that carry user-facing words — the guard-rail explanations F2 §F2.3 translates.
 * A `Record` over each contract's own code enum, so a route code without copy fails compile
 * here, once, for both platforms.
 */
const ROUTE_COPY: Record<TenantErrorCode | InvitationErrorCode, { id: string }> = {
  LAST_OWNER: /*i18n*/ {
    id: 'This person is the only EPC Owner. A company always keeps at least one EPC Owner and one person who can manage the team.',
  },
  ALREADY_MEMBER: /*i18n*/ { id: 'This number is already on your team.' },
  ALREADY_INVITED: /*i18n*/ {
    id: 'An invite already went to this number and is still open.',
  },
  INVITE_CAP_REACHED: /*i18n*/ {
    id: 'Your company has sent today’s invites. Try again tomorrow.',
  },
  INVITE_EXPIRED: /*i18n*/ { id: 'This invite has run out. Ask to be invited again.' },
  INVITE_DELIVERY_FAILED: /*i18n*/ {
    id: 'The invite could not be sent. Try again in a moment.',
  },
};

export interface ApiErrorLike {
  code: string;
  message: string;
  requestId?: string;
}

/** Catalog id for a code this package has words for — base or route; undefined → render `error.message`. */
export function apiErrorMessageId(code: string): string | undefined {
  return (
    (COPY as Partial<Record<string, { id: string }>>)[code]?.id ??
    (ROUTE_COPY as Partial<Record<string, { id: string }>>)[code]?.id
  );
}

/** Support-reference suffix — INTERNAL failures carry the trace id into the ticket. */
export function apiErrorRef(error: ApiErrorLike): string | undefined {
  return error.code === 'INTERNAL' && error.requestId !== undefined
    ? `Ref: ${error.requestId}`
    : undefined;
}
