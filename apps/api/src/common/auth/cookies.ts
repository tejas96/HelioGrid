import type { Request, Response } from 'express';
import { ENV } from '../../config/env';

/**
 * The two cookies the front door sets (`M01-07`): the session — the refresh grant, sent only
 * to `/auth` — and the API token every call carries. Both HttpOnly and SameSite=Lax; Secure
 * outside development, where the browser talks to a plain-http localhost.
 */
export const SESSION_COOKIE = 'hg_session';
export const TOKEN_COOKIE = 'hg_token';

const SESSION_COOKIE_PATH = '/auth';
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
