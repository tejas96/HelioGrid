import { REQUEST_ID_HEADER } from '@heliogrid/contracts';
import { type ApiFetcher, type ApiFetcherArgs, tsRestFetchApi } from '@ts-rest/core';
import { ZodError } from 'zod';
import type { DataError } from '../errors/errors';
import {
  InvalidResponseError,
  NetworkError,
  RequestCancelledError,
  RequestTimeoutError,
} from '../errors/errors';
import type { TokenStorage } from './storage';

type HeadersWithSetCookie = Headers & { getSetCookie?: () => string[] };

/** What a Next server component can hand us — its own `headers()` or a plain record. */
export type RequestHeaders =
  | Headers
  | Readonly<Record<string, string | readonly string[] | undefined>>;

type TransportConfig =
  | { mode: 'browser' }
  | { mode: 'mobile'; storage: TokenStorage }
  | { mode: 'server'; headers: RequestHeaders };

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * The ONLY headers a server render forwards. An allowlist, never a spread of the incoming
 * request: `host`, `content-length` and `accept-encoding` describe the BROWSER's request and
 * corrupt ours, and anything else is one header away from leaking a caller's identity into a
 * request it never made. No tenant header — tenancy is resolved from the session, never sent.
 */
const FORWARDED_SERVER_HEADERS = ['authorization', 'cookie', REQUEST_ID_HEADER] as const;

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

function forwardedHeaders(input: RequestHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  for (const name of FORWARDED_SERVER_HEADERS) {
    const value =
      input instanceof Headers
        ? input.get(name)
        : Object.entries(input).find(([key]) => key.toLowerCase() === name)?.[1];
    if (typeof value === 'string' && value.length > 0) result[name] = value;
  }
  return result;
}

interface RequestDeadline {
  /** The signal handed to fetch — aborts on caller cancellation OR on timeout. */
  signal: AbortSignal;
  /** Why the fetch failed, decided by WHO aborted rather than by the fetch error text. */
  classify(error: unknown): DataError;
  release(): void;
}

/**
 * Binds one request to a timeout and to the caller's signal, and remembers which of the two
 * fired. A rejected fetch says only "aborted" — asking the DOM afterwards cannot tell a user
 * navigating away from a server that never answered, and the two must not retry alike.
 * `release()` is unconditional: an un-cleared timer keeps a mobile app awake, and a listener
 * left on a long-lived caller signal accumulates one entry per request.
 */
function openRequestDeadline(callerSignal: AbortSignal | null | undefined): RequestDeadline {
  const controller = new AbortController();
  let abortedBy: 'caller' | 'timeout' | undefined;
  const cancelFromCaller = () => {
    abortedBy = 'caller';
    controller.abort();
  };
  callerSignal?.addEventListener('abort', cancelFromCaller, { once: true });
  const timer = setTimeout(() => {
    abortedBy = 'timeout';
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  return {
    signal: controller.signal,
    classify(error) {
      if (abortedBy === 'caller') return new RequestCancelledError();
      if (abortedBy === 'timeout') return new RequestTimeoutError();
      // A JSON body the server said was JSON and was not — a proxy error page, typically.
      if (error instanceof SyntaxError) return new InvalidResponseError();
      return new NetworkError();
    },
    release() {
      clearTimeout(timer);
      callerSignal?.removeEventListener('abort', cancelFromCaller);
    },
  };
}

/** Applies the mobile cookie jar around one fetch; browser and server modes skip it. */
async function sendRequest(
  config: TransportConfig,
  args: ApiFetcherArgs,
  signal: AbortSignal,
): Promise<Awaited<ReturnType<ApiFetcher>>> {
  const headers = { ...args.headers };
  if (config.mode === 'server') Object.assign(headers, forwardedHeaders(config.headers));
  if (config.mode === 'mobile') {
    const cookie = await config.storage.get();
    if (cookie) headers.cookie = cookie;
  }
  const result = await tsRestFetchApi({
    ...args,
    headers,
    fetchOptions: {
      ...args.fetchOptions,
      credentials: config.mode === 'browser' ? 'include' : 'omit',
      signal,
    },
  });
  if (config.mode === 'mobile') await absorbRotation(result.headers, config.storage);
  return result;
}

/**
 * EVERY request in both apps passes through here. Retry, logging, tracing and token refresh
 * land in THIS function and nowhere else — that is the whole reason this layer exists.
 *
 * `credentials` is set HERE and not on the client because the platforms need opposite
 * values, and getting that wrong is silent:
 *  - web has no storage; the browser owns the HttpOnly cookie and must send it cross-origin.
 *  - RN has storage, and the jar is then the ONLY cookie path. With native handling on, iOS
 *    CFNetwork merges its own copy into our manual header ("token,token") and the server
 *    rejects the session — a 401 with everything looking correct (hit 2026-07-26).
 *  - a Next server render has no cookie jar at all: it forwards the allowlist above and
 *    otherwise sends nothing, so one render can never inherit another request's identity.
 */
export function createTransport(config: TransportConfig): ApiFetcher {
  return async (args) => {
    const callerSignal = args.fetchOptions?.signal;
    // Already-cancelled work must not open a socket — and must not be reported as a network
    // failure, which is what a retry policy would act on.
    if (callerSignal?.aborted) throw new RequestCancelledError();

    const deadline = openRequestDeadline(callerSignal);
    try {
      return await sendRequest(config, args, deadline.signal);
    } catch (error) {
      // ts-rest runs client response validation INSIDE the fetcher, so a contract mismatch
      // surfaces here as a raw ZodError. It is a bad response, not a bad network: pass it
      // through untouched and let normalizeClientError strip the Zod internals.
      if (error instanceof ZodError) throw error;
      throw deadline.classify(error);
    } finally {
      deadline.release();
    }
  };
}
