import { openErrorEnvelopeSchema } from '@heliogrid/contracts';

/** A non-2xx the server described with the canonical error envelope. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Named separately so a caller can branch on "signed out" without matching on 401. */
export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Parse with the contract's OWN schema so no caller hand-declares the envelope shape.
 * This replaces web's `envelopeMessage(err)` helper: the human-safe copy is already on the
 * thrown ApiError, so a second extraction function would be a redundant surface.
 */
export function toApiError(res: { status: number; body: unknown }): ApiError {
  const parsed = openErrorEnvelopeSchema.safeParse(res.body);
  const message = parsed.success ? parsed.data.error.message : `request failed (${res.status})`;
  return res.status === 401 ? new UnauthorizedError(message) : new ApiError(res.status, message);
}
