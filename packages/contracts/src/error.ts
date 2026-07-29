import { z } from 'zod';

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
  'FORBIDDEN',
  'ENTITLEMENT_BLOCKED',
  'NOT_FOUND',
  'CONFLICT',
  'DOMAIN_RULE_VIOLATION',
  'RATE_LIMITED',
  'INTERNAL',
] as const;

export const baseErrorCodeSchema = z.enum(baseErrorCodes);
export type BaseErrorCode = z.infer<typeof baseErrorCodeSchema>;

export const errorDetailSchema = z.object({
  path: z.string(),
  issue: z.string(),
});

/**
 * Build the envelope for a route's declared code union.
 * Usage: `errorEnvelope(z.enum(['NOT_FOUND', 'LEAD_ALREADY_WON']))`.
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
 * 400 VALIDATION_FAILED · 401 UNAUTHENTICATED · 403 FORBIDDEN / ENTITLEMENT_BLOCKED ·
 * 404 NOT_FOUND (not-found-or-not-yours — never reveal existence across tenants) ·
 * 409 CONFLICT (version/optimistic-concurrency) · 422 DOMAIN_RULE_VIOLATION ·
 * 429 RATE_LIMITED · 5xx INTERNAL (opaque).
 */
export const errorHttpStatusByCode: Record<BaseErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ENTITLEMENT_BLOCKED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DOMAIN_RULE_VIOLATION: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};
