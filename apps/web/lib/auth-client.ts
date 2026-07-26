'use client';
import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';

/** Browser session is a first-party cookie on the api origin — credentials included. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [phoneNumberClient()],
  fetchOptions: { credentials: 'include' },
});

/** Typed-enough fetch for the /auth product surface (ts-rest client lands with CRM slice). */
export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  return { status: res.status, body: (await res.json()) as T };
}
