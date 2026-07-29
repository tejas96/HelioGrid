'use client';
import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { API_URL } from './env';

/** Browser session is a first-party cookie on the api origin — credentials included. */
export { API_URL };

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [phoneNumberClient()],
  fetchOptions: { credentials: 'include' },
});

/*
 * There is deliberately NO hand-rolled fetch helper here. Every product API call goes
 * through the contract-checked client in lib/api-client.ts — an untyped `api<T>()` lets a
 * screen invent a response shape the backend never returns, which typecheck cannot catch.
 */
