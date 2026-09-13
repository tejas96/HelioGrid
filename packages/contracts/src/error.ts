import { z } from 'zod';
import { extensibleEnum } from './common';

/**
 * Canonical error contract (apps/api/CLAUDE.md): every non-2xx body is
 * `{ error: { code, message, details?, requestId } }`.
 * `code` is UPPER_SNAKE from a per-contract enum — never free text.
 * `message` is human-safe — never stack traces or SQL.
 */

/** Platform-wide base codes; feature contracts extend with their own enums. */
export const baseErrorCodes = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  /**
   * The request carried NO credential of any kind — no bearer, no token cookie, no session
   * cookie. Distinct from `UNAUTHENTICATED`, which means one was carried and did not work.
   *
   * The difference is the CLIENT's, not the server's: on a plain `UNAUTHENTICATED` the transport
   * spends one refresh, which is how a restarted phone with a lapsed token comes back signed in;
   * on this code there is nothing to refresh WITH, so it spends nothing. Without the distinction
   * every signed-out page load posted a refresh that could not succeed.
   */
  'NO_CREDENTIAL',
  'FORBIDDEN',
  'ENTITLEMENT_BLOCKED',
  'NOT_FOUND',
  'CONFLICT',
  'DOMAIN_RULE_VIOLATION',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'INTERNAL',
] as const;

export const baseErrorCodeSchema = z.enum(baseErrorCodes);
export type BaseErrorCode = z.infer<typeof baseErrorCodeSchema>;

export const errorDetailSchema = z.object({
  path: z.string(),
  issue: z.string(),
});
export type ErrorDetail = z.infer<typeof errorDetailSchema>;

/**
 * A single BASE code for a route's envelope, checked against the platform list — a typo does not
 * compile. A route-specific code has no list to check against and stays a `z.literal`.
 * Usage: `errorEnvelope(baseError('NOT_FOUND'))`.
 */
export const baseError = <C extends BaseErrorCode>(code: C) => z.literal(code);

/**
 * Build the envelope for a route's declared code union.
 * Usage: `errorEnvelope(z.enum(['NOT_FOUND', 'LEAD_ALREADY_WON']))` for a list,
 * `errorEnvelope(baseError('NOT_FOUND'))` for one base code.
 */
export function errorEnvelope<C extends z.ZodTypeAny>(code: C) {
  return z.object({
    error: z.object({
      code,
      message: z.string(),
      details: z.array(errorDetailSchema).optional(),
      requestId: z.string(),
    }),
  });
}

/** The generic envelope (any base code) — used by the global exception filter. */
export const genericErrorSchema = errorEnvelope(baseErrorCodeSchema);
export type ErrorEnvelope = z.infer<typeof genericErrorSchema>;

/**
 * Envelope with the code left open. Clients that only need the human-safe `message` parse
 * with this instead of re-declaring `{ error: { message } }` locally — route-specific
 * codes (ALREADY_ONBOARDED, LAST_OWNER…) are not in the base union and would fail
 * `genericErrorSchema`. The envelope SHAPE stays defined exactly once, here.
 */
export const openErrorEnvelopeSchema = errorEnvelope(z.string());

/**
 * HTTP mapping (apps/api/CLAUDE.md — binding):
 * 400 VALIDATION_FAILED · 401 UNAUTHENTICATED / NO_CREDENTIAL · 403 FORBIDDEN / ENTITLEMENT_BLOCKED ·
 * 404 NOT_FOUND (not-found-or-not-yours — never reveal existence across tenants) ·
 * 409 CONFLICT (version/optimistic-concurrency) · 422 DOMAIN_RULE_VIOLATION ·
 * 413 PAYLOAD_TOO_LARGE · 429 RATE_LIMITED · 5xx INTERNAL (opaque).
 */
export const errorHttpStatusByCode: Record<BaseErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  NO_CREDENTIAL: 401,
  FORBIDDEN: 403,
  ENTITLEMENT_BLOCKED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DOMAIN_RULE_VIOLATION: 422,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/**
 * The 401 envelope EVERY guarded route declares. One declaration, so a new authentication code
 * is one edit here rather than one per route, and the eight routes cannot drift apart.
 *
 * EXTENSIBLE, deliberately. A closed set would make every future authentication code a breaking
 * change: a client built before it — an installer's phone in the field above all — validates the
 * response and refuses the whole reply, so the app never sees the error at all. The known codes
 * still travel as `x-extensible-enum` for readers and for the breaking-change judge (`M26`), and
 * a reader keeps a fallback for a code it does not know.
 *
 * The two codes differ for the CLIENT, not the person: both read "sign in", but a credential
 * that did not work is worth one refresh — a restarted phone with a lapsed token comes back
 * signed in that way — and no credential at all is worth none.
 */
export const AUTHENTICATION_CODES = ['UNAUTHENTICATED', 'NO_CREDENTIAL'] as const;
export const unauthenticatedEnvelope = errorEnvelope(extensibleEnum(AUTHENTICATION_CODES));

/**
 * Which code a plain framework exception becomes, per status.
 *
 * EXPLICIT, and that is the whole point. Several codes share a status — 401 is both
 * `UNAUTHENTICATED` and `NO_CREDENTIAL`, 403 both `FORBIDDEN` and `ENTITLEMENT_BLOCKED` — so a
 * reverse `find` over `errorHttpStatusByCode` answers with whichever happens to be declared
 * FIRST, and re-ordering that map then silently changes what every 401 in the API says. It did:
 * adding `NO_CREDENTIAL` above `UNAUTHENTICATED` turned every ordinary refusal into
 * "you sent nothing", and only a real request showed it.
 *
 * The others are reachable ONLY through `ContractException`, deliberately, at a throw site that
 * knows which it means. A code missing here is one no framework exception can produce.
 */
export const genericErrorCodeByStatus: Record<number, BaseErrorCode> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'DOMAIN_RULE_VIOLATION',
  429: 'RATE_LIMITED',
  500: 'INTERNAL',
};
