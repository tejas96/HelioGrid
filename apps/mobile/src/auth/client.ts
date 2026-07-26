import { createAuthClient } from 'better-auth/client';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { Platform } from 'react-native';
import { keychainStorage } from './keychain-storage';

/**
 * S1-verified pattern: vanilla client + our own cookie-jar glue over keychain.
 * The jar is the ONLY cookie path: every request runs `credentials: 'omit'` so iOS
 * never natively stores/attaches cookies — with native handling on, CFNetwork merges
 * its copy into our manual header ("token,token") and the server rejects the session
 * (hit 2026-07-26). Absorption uses getSetCookie(), never .get('set-cookie') — the
 * S1 verdict: .get() joins multiple Set-Cookie headers lossily.
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

type HeadersWithSetCookie = Headers & { getSetCookie?: () => string[] };

export async function absorbSetCookies(headers: Headers) {
  const getSetCookie = (headers as HeadersWithSetCookie).getSetCookie;
  const setCookies =
    typeof getSetCookie === 'function'
      ? getSetCookie.call(headers)
      : [headers.get('set-cookie')].filter((v): v is string => v !== null);
  if (setCookies.length === 0) return;

  // Merge by cookie name over the existing jar (session rotation updates in place).
  const jar = new Map<string, string>();
  for (const pair of (cookieCache ?? '').split('; ')) {
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  for (const setCookie of setCookies) {
    const pair = setCookie.split(';')[0] ?? '';
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  // Self-heal: cookie values never contain commas/spaces — drop anything mangled by
  // a pre-fix lossy join persisted in the keychain.
  for (const [name, value] of jar) {
    if (/[,\s]/.test(value) || /[,\s]/.test(name)) jar.delete(name);
  }
  if (jar.size === 0) return;
  const serialized = [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  cookieCache = serialized;
  await keychainStorage.setItem(JAR_KEY, serialized);
}

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [phoneNumberClient()],
  fetchOptions: {
    credentials: 'omit',
    onRequest: async (ctx) => {
      const cookie = await loadCookie();
      if (cookie) ctx.headers.set('cookie', cookie);
    },
    onResponse: async (ctx) => {
      await absorbSetCookies(ctx.response.headers);
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
    credentials: 'omit',
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });
  await absorbSetCookies(res.headers);
  return { status: res.status, body: (await res.json()) as T };
}
