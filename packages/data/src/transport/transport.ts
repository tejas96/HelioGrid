import { type ApiFetcher, tsRestFetchApi } from '@ts-rest/core';
import type { TokenStorage } from './storage';

type HeadersWithSetCookie = Headers & { getSetCookie?: () => string[] };

/**
 * Merge Set-Cookie rotations into the stored jar, keyed by cookie name.
 * Read with getSetCookie(), NEVER headers.get('set-cookie'): .get() joins multiple
 * Set-Cookie headers lossily and the server then rejects the session (hit 2026-07-26).
 */
async function absorbRotation(headers: Headers, storage: TokenStorage): Promise<void> {
  const getSetCookie = (headers as HeadersWithSetCookie).getSetCookie;
  const setCookies =
    typeof getSetCookie === 'function'
      ? getSetCookie.call(headers)
      : [headers.get('set-cookie')].filter((v): v is string => v !== null);
  if (setCookies.length === 0) return;

  const jar = new Map<string, string>();
  for (const pair of ((await storage.get()) ?? '').split('; ')) {
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
  }
  for (const setCookie of setCookies) {
    const pair = setCookie.split(';')[0] ?? '';
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
  // Self-heal: cookie names and values never contain commas or spaces — drop anything a
  // pre-fix lossy join left behind in storage.
  for (const [name, value] of jar) {
    if (/[,\s]/.test(value) || /[,\s]/.test(name)) jar.delete(name);
  }
  if (jar.size === 0) return;
  await storage.set([...jar].map(([name, value]) => `${name}=${value}`).join('; '));
}

/**
 * EVERY request in both apps passes through here. Retry, logging, tracing and token refresh
 * land in THIS function and nowhere else — that is the whole reason this layer exists.
 *
 * `credentials` is set HERE and not on the client because the two platforms need opposite
 * values, and getting that wrong is silent:
 *  - web has no storage; the browser owns the HttpOnly cookie and must send it cross-origin.
 *  - RN has storage, and the jar is then the ONLY cookie path. With native handling on, iOS
 *    CFNetwork merges its own copy into our manual header ("token,token") and the server
 *    rejects the session — a 401 with everything looking correct (hit 2026-07-26).
 */
export function createTransport(storage?: TokenStorage): ApiFetcher {
  if (!storage) {
    return (args) =>
      tsRestFetchApi({ ...args, fetchOptions: { ...args.fetchOptions, credentials: 'include' } });
  }

  return async (args) => {
    const cookie = await storage.get();
    if (cookie) args.headers.cookie = cookie;
    const result = await tsRestFetchApi({
      ...args,
      fetchOptions: { ...args.fetchOptions, credentials: 'omit' },
    });
    await absorbRotation(result.headers, storage);
    return result;
  };
}
