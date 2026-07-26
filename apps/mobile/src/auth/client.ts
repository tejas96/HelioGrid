import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { Platform } from 'react-native';
import { keychainStorage } from './keychain-storage';

/**
 * S1-verified pattern: vanilla client + our own cookie-jar glue over keychain.
 * RN fetch may also natively manage cookies — our manual header is authoritative
 * (S1 note); the jar lives under ONE keychain key, values treated as opaque.
 */
export const API_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

const JAR_KEY = 'cookie-jar';
let cookieCache: string | null = null;

export async function loadCookie(): Promise<string | null> {
  if (cookieCache === null) cookieCache = await keychainStorage.getItem(JAR_KEY);
  return cookieCache;
}

export async function absorbSetCookieHeader(setCookie: string | null) {
  if (!setCookie) return;
  // Keep only the session pair (name=value before the first attribute).
  const pair = setCookie.split(';')[0];
  if (pair?.includes('=')) {
    cookieCache = pair;
    await keychainStorage.setItem(JAR_KEY, pair);
  }
}

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [phoneNumberClient()],
  fetchOptions: {
    onRequest: async (ctx) => {
      const cookie = await loadCookie();
      if (cookie) ctx.headers.set('cookie', cookie);
    },
    onResponse: async (ctx) => {
      await absorbSetCookieHeader(ctx.response.headers.get('set-cookie'));
    },
  },
});

/** Product-surface fetch with the same jar (repository layer wraps this per module). */
export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const cookie = await loadCookie();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });
  await absorbSetCookieHeader(res.headers.get('set-cookie'));
  return { status: res.status, body: (await res.json()) as T };
}
