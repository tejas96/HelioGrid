import type {
  BaseErrorCode,
  InvitationErrorCode,
  TenantErrorCode,
  TenantSettingsErrorCode,
} from '@heliogrid/contracts';
import type { TransportFailure } from '@heliogrid/domain';

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
  /* The SAME sentence, deliberately: the two codes differ for the transport — one is worth a
     token refresh and the other has nothing to refresh with — and not for the person, who is
     signed out either way. One id means one catalog entry and one translation, not two that
     must be kept saying the same thing. */
  NO_CREDENTIAL: /*i18n*/ { id: "You're signed out. Sign in to continue." },
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
const ROUTE_COPY: Record<
  TenantErrorCode | InvitationErrorCode | TenantSettingsErrorCode,
  { id: string }
> = {
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
  TRANCHES_NOT_WHOLE: /*i18n*/ {
    id: 'The tranches must add up to exactly 100%. Place the remainder before saving.',
  },
  TAX_REGISTRATION_MALFORMED: /*i18n*/ {
    id: 'That does not read as a registration of this type. Check it against the format shown.',
  },
};

/**
 * `F8-36` — the words for an attempt the server gave no readable answer to. None of these can know
 * whether a write landed, so each says to check before trying again and none says it failed. The
 * same sentences fit a read, where the "if you were saving" clause asks nothing.
 */
const TRANSPORT_COPY: Record<TransportFailure, { id: string }> = {
  no_connection: /*i18n*/ {
    id: 'HelioGrid could not be reached, from your side or ours. If you were saving, check whether it saved before trying again.',
  },
  no_answer: /*i18n*/ {
    id: 'HelioGrid did not answer in time. If you were saving, check whether it saved before trying again.',
  },
  unreadable_answer: /*i18n*/ {
    id: "HelioGrid's answer could not be read. If you were saving, check whether it saved before trying again.",
  },
  cancelled: /*i18n*/ {
    id: 'This stopped before HelioGrid answered. If you were saving, check whether it saved before trying again.',
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

/** A failed attempt as `@heliogrid/data`'s `DataError` describes it. */
export interface AttemptFailureLike {
  /** Set only by the client; `null` when the server answered with its own envelope. */
  failure: TransportFailure | null;
  /** The server's code — only an answer from the server carries one. */
  code?: string;
}

/**
 * `F8-36` — the catalog id for any failed attempt: the failure's words when the server gave no
 * readable answer, else the server code's. Choosing by `failure` rather than by `code` is what keeps
 * a server code that happens to be spelled like a failure on the server's side.
 * Undefined → render `error.message`, as for `apiErrorMessageId`.
 */
export function attemptFailureMessageId(error: AttemptFailureLike): string | undefined {
  if (error.failure !== null) return TRANSPORT_COPY[error.failure].id;
  return error.code === undefined ? undefined : apiErrorMessageId(error.code);
}
