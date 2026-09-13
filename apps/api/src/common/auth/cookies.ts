import { AUTH_PATH_PREFIX } from '@heliogrid/contracts';
import type { Request, Response } from 'express';
import { ENV } from '../../config/env';

/**
 * The two cookies the front door sets (`M01-07`): the session — the refresh grant, sent only
 * to `/auth` — and the API token every call carries. Both HttpOnly and SameSite=Lax; Secure
 * outside development, where the browser talks to a plain-http localhost.
 */
export const SESSION_COOKIE = 'hg_session';
export const TOKEN_COOKIE = 'hg_token';

/* The contract's own prefix: a cookie scoped to a path the routes have left is simply not
   sent, and the failure looks like an expired session rather than a misplaced cookie. */
const SESSION_COOKIE_PATH = AUTH_PATH_PREFIX;
const MS_PER_SECOND = 1_000;

function attributes(path: string, expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: ENV.NODE_ENV === 'production',
    path,
    expires: new Date(expiresAt),
  };
}

export function setSessionCookie(res: Response, secret: string, expiresAt: number): void {
  res.cookie(SESSION_COOKIE, secret, attributes(SESSION_COOKIE_PATH, expiresAt));
}

export function setTokenCookie(res: Response, token: string, expiresAt: number): void {
  res.cookie(TOKEN_COOKIE, token, attributes('/', expiresAt));
}

/**
 * Did this request carry ANY credential — a bearer, the token cookie, or the session cookie?
 *
 * The two are told apart for the CLIENT's sake: a request with a credential that did not work
 * is worth one refresh (a restarted phone with a lapsed token comes back signed in that way),
 * and a request carrying nothing has nothing to refresh with. The session cookie is scoped to
 * the auth prefix, so on a route outside it only the token cookie and the bearer can appear —
 * which is the lapsed-token case, and answers `true` here exactly as it should.
 */
export function carriesCredential(req: Request): boolean {
  if (bearerOrTokenCookie(req) !== undefined) return true;
  // `cookieOf`, never `req.cookies`: there is no cookie-parser in this app and that property
  // does not exist, so reading it answered "no credential" for a request that carried a perfectly
  // good session cookie — the restarted-phone case, which must keep its refresh.
  return cookieOf(req, SESSION_COOKIE) !== undefined;
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: SESSION_COOKIE_PATH });
  res.clearCookie(TOKEN_COOKIE, { path: '/' });
}

/**
 * The response paired with a request, for setting cookies from a ts-rest handler. Nest treats an
 * injected `@Res()` as a handled response even with `passthrough`, and the handler's return value
 * then never leaves the process; express keeps the pair on the request itself.
 */
export function responseOf(req: Request): Response {
  if (!req.res) throw new Error('This request carries no response.');
  return req.res;
}

/** One cookie's value off the raw header. No cookie-parser: this is the only reader. */
export function cookieOf(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const pair of header.split(';')) {
    const eq = pair.indexOf('=');
    if (eq > 0 && pair.slice(0, eq).trim() === name) return pair.slice(eq + 1).trim();
  }
  return undefined;
}

/** The API token: the `Authorization` bearer when a caller sends one, else the token cookie. */
export function bearerOrTokenCookie(req: Request): string | undefined {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) return authorization.slice('Bearer '.length).trim();
  return cookieOf(req, TOKEN_COOKIE);
}

/** Seconds from now until `expiresAt`, never negative; the shape a cache header wants. */
export function secondsUntil(expiresAt: number, now: number): number {
  return Math.max(0, Math.floor((expiresAt - now) / MS_PER_SECOND));
}
