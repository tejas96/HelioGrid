import { openErrorEnvelopeSchema } from '@heliogrid/contracts';

export interface ApiErrorDetail {
  path: string;
  issue: string;
}

interface EnvelopeFields {
  code?: string;
  details?: readonly ApiErrorDetail[];
  requestId?: string;
}

/** A non-2xx the server described with the canonical error envelope. */
export class ApiError extends Error {
  readonly status: number;
  /**
   * UPPER_SNAKE envelope code ('VALIDATION_FAILED', route-specific literals…).
   * 'UNKNOWN' when the body was not the envelope (e.g. a proxy's HTML error page) —
   * apiErrorContent then falls back to `message`, never to wrong copy.
   */
  readonly code: string;
  readonly details?: readonly ApiErrorDetail[];
  readonly requestId?: string;

  constructor(status: number, message: string, envelope?: EnvelopeFields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope?.code ?? 'UNKNOWN';
    this.details = envelope?.details;
    this.requestId = envelope?.requestId;
  }
}

/** Named separately so a caller can branch on "signed out" without matching on 401. */
export class UnauthorizedError extends ApiError {
  constructor(message: string, envelope?: EnvelopeFields) {
    super(401, message, envelope);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Parse with the contract's OWN schema so no caller hand-declares the envelope shape.
 * The human-safe copy is on the thrown ApiError; code/details/requestId ride along for
 * apiErrorContent (i18n) and applyServerErrors (forms).
 */
export function toApiError(res: { status: number; body: unknown }): ApiError {
  const parsed = openErrorEnvelopeSchema.safeParse(res.body);
  const message = parsed.success ? parsed.data.error.message : `request failed (${res.status})`;
  const envelope = parsed.success
    ? {
        code: parsed.data.error.code,
        details: parsed.data.error.details,
        requestId: parsed.data.error.requestId,
      }
    : undefined;
  return res.status === 401
    ? new UnauthorizedError(message, envelope)
    : new ApiError(res.status, message, envelope);
}
