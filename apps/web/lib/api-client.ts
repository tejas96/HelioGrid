'use client';
import { apiContract, openErrorEnvelopeSchema } from '@heliogrid/contracts';
import { initQueryClient } from '@ts-rest/react-query';
import { API_URL } from './auth-client';

/**
 * THE typed client — every product API call goes through this (contract-checked at
 * compile time; a backend/frontend shape mismatch is a build error, not a runtime bug).
 * Session rides the first-party cookie on the api origin.
 */
export const api = initQueryClient(apiContract, {
  baseUrl: API_URL,
  baseHeaders: {},
  credentials: 'include',
});

/**
 * Pull the human-safe message out of a rejected ts-rest call. The client rejects with the
 * response, whose body is the canonical error envelope — parsed with the contract's own
 * schema so no screen hand-declares the envelope shape. Returns undefined for transport
 * failures (offline, DNS), where the caller supplies its own copy.
 */
export function envelopeMessage(err: unknown): string | undefined {
  const parsed = openErrorEnvelopeSchema.safeParse((err as { body?: unknown } | null)?.body);
  return parsed.success ? parsed.data.error.message : undefined;
}
