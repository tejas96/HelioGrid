import { AUTH_PATH_PREFIX, REQUEST_ID_HEADER } from '@heliogrid/contracts';
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

/**
 * What the transport tells the layer above when a refresh cannot save a call. It REPORTS; it
 * never reaches for the session store, which sits above it and would be a cycle. `createDataLayer`
 * is the one place the two are joined.
 *
 * REQUIRED on every mode that can hold a session, deliberately. Optional, it could be unwired
 * and everything would still compile — the store would go back to saying `authenticated` while
 * every call 401'd, and nothing would say so until someone noticed a screen rendering for a
 * person who had been signed out. A server render has no session to lose and declares no field.
 */
export interface SessionSignals {
  /** A refresh was attempted and failed: whoever held this session no longer has one. */
  onSessionLost(): void;
  /** False once the session is known to be gone, so a doomed refresh is not attempted again. */
  couldHoldSession(): boolean;
}

type TransportConfig =
  | { mode: 'browser'; baseUrl: string; session: SessionSignals }
  | { mode: 'mobile'; storage: TokenStorage; baseUrl: string; session: SessionSignals }
  | { mode: 'server'; headers: RequestHeaders };

const UNAUTHENTICATED = 401;
/* The server's word for "you carried no credential at all" — nothing to refresh WITH, so the
   transport spends nothing. Read from the body, because both refusals are 401 by design. */
const NO_CREDENTIAL = 'NO_CREDENTIAL';
const OK = 200;
/* From the contract, not retyped: the transport skips its one refresh-and-retry for the
   refresh call itself, and it recognises that call by this path. */
const AUTH_PREFIX = `${AUTH_PATH_PREFIX}/`;

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * The ONLY headers a server render forwards. An allowlist, never a spread of the incoming
 * request: `host`, `content-length` and `accept-encoding` describe the BROWSER's request and
 * corrupt ours, and anything else is one header away from leaking a caller's identity into a
 * request it never made. No tenant header — tenancy is resolved from the session, never sent.
 */
const FORWARDED_SERVER_HEADERS = ['authorization', 'cookie', REQUEST_ID_HEADER] as const;

/**
 * A joined `set-cookie` value split back into its cookies. React Native's fetch has no
 * `getSetCookie()` and joins repeated headers with `, ` — so a response that rotates both the
 * session and the token arrives as ONE string, and reading only its first pair is how the phone
 * lost its token on every sign-in and forgot the session on the next restart. A cookie value
 * never contains a comma; the comma inside `Expires=Wed, 11 Sep …` is followed by a digit, not
 * by a `name=`, so the split lands only between cookies.
 */
const BETWEEN_COOKIES = /,\s*(?=[^;,\s=]+=)/;

function cookiesOf(headers: Headers): string[] {
  const getSetCookie = (headers as HeadersWithSetCookie).getSetCookie;
  if (typeof getSetCookie === 'function') return getSetCookie.call(headers);
  const joined = headers.get('set-cookie');
  return joined === null ? [] : joined.split(BETWEEN_COOKIES);
}

/** Merge Set-Cookie rotations into the stored jar, keyed by cookie name. */
async function absorbRotation(headers: Headers, storage: TokenStorage): Promise<void> {
  const setCookies = cookiesOf(headers);
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
 * The ten-minute API token is renewed from the session cookie (`M01-07`): a 401 on any route
 * but the refresh itself is answered by ONE refresh and ONE retry — the boot check
 * (`GET /auth/session`) included, which is how a restarted phone whose token has lapsed comes
 * back signed in. That is why the boot check may NOT simply skip the retry. A server render
 * never refreshes: it holds no jar and must not rotate a visitor's cookies.
 *
 * A refresh that FAILS still hands the original 401 to the caller — but it now also says so.
 * Without that, the session store stayed `authenticated` while every call 401'd, and a screen
 * behind the gate kept rendering for someone the server had already stopped recognising. And
 * once the session is known to be gone, a further 401 gets no refresh at all: a wrong OTP code
 * answers 401, so five tries used to post five doomed refreshes behind them.
 */
/**
 * Did the server say the request carried nothing at all? A refresh renews a credential; with
 * none to renew it is one round trip that can only 401 again, which is what every signed-out
 * page load used to pay. The body is read defensively — a shape we do not recognise is treated
 * as an ordinary refusal, which spends a refresh rather than wrongly withholding one.
 */
function carriedNothing(response: Awaited<ReturnType<ApiFetcher>>): boolean {
  const body = response.body as { error?: { code?: unknown } } | undefined;
  return body?.error?.code === NO_CREDENTIAL;
}

async function refreshedOnce(
  config: TransportConfig,
  args: ApiFetcherArgs,
  signal: AbortSignal,
  first: Awaited<ReturnType<ApiFetcher>>,
): Promise<Awaited<ReturnType<ApiFetcher>>> {
  if (config.mode === 'server' || first.status !== UNAUTHENTICATED) return first;
  if (new URL(args.path).pathname === `${AUTH_PREFIX}refresh`) return first;
  if (!config.session.couldHoldSession()) return first;
  if (carriedNothing(first)) return first;
  if (config.mode === 'mobile' && (await config.storage.get()) === null) return first;
  const refreshed = await sendRequest(
    config,
    {
      ...args,
      path: `${config.baseUrl}${AUTH_PREFIX}refresh`,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ foreground: true }),
      rawBody: { foreground: true },
      contentType: 'application/json',
      validateResponse: false,
    },
    signal,
  );
  if (refreshed.status === OK) return sendRequest(config, args, signal);
  config.session.onSessionLost();
  return first;
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
 *    rejects the session — a 401 with everything looking correct.
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
      const first = await sendRequest(config, args, deadline.signal);
      return await refreshedOnce(config, args, deadline.signal, first);
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
