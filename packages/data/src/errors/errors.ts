import { type ErrorDetail, openErrorEnvelopeSchema } from '@heliogrid/contracts';
import { ResponseValidationError, UnknownStatusError } from '@ts-rest/core';
import { ZodError } from 'zod';

export type ApiErrorDetail = ErrorDetail;

interface EnvelopeFields {
  code?: string;
  details?: readonly ErrorDetail[];
  requestId?: string;
}

/** Stable base for failures crossing the data-layer boundary. */
export class DataError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'DataError';
  }
}

/** A non-2xx the server described with the canonical error envelope. */
export class ApiError extends DataError {
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
    super(message, status >= 500 && status <= 599);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope?.code ?? 'UNKNOWN';
    this.details = envelope?.details;
    this.requestId = envelope?.requestId;
  }
}

export class NetworkError extends DataError {
  constructor() {
    super('The network request failed.', true);
    this.name = 'NetworkError';
  }
}

export class RequestTimeoutError extends DataError {
  constructor() {
    super('The network request timed out.', true);
    this.name = 'RequestTimeoutError';
  }
}

export class RequestCancelledError extends DataError {
  constructor() {
    super('The request was cancelled.', false);
    this.name = 'RequestCancelledError';
  }
}

export class InvalidResponseError extends DataError {
  constructor() {
    super('The server returned an invalid response.', false);
    this.name = 'InvalidResponseError';
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

/** Collapse ts-rest/Zod/provider internals into the stable errors exposed by this package. */
export function normalizeClientError(error: unknown): DataError {
  if (error instanceof DataError) return error;
  if (error instanceof UnknownStatusError) return toApiError(error.response);
  if (error instanceof ResponseValidationError || error instanceof ZodError) {
    return new InvalidResponseError();
  }
  return new InvalidResponseError();
}
