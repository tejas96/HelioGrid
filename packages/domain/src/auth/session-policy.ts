/**
 * Session lifetimes (`M01-07`), as the numbers and the two decisions both platforms obey. Time
 * enters as `now: number` (epoch milliseconds); nothing here reads a clock.
 *
 * Web rolls: every use pushes the expiry a full window out. Mobile idles: only FOREGROUND use
 * restarts its window — background refresh, push handling and scheduled work never do — and
 * the API token every call carries lives at most `API_TOKEN_MINUTES`, which is what bounds a
 * revocation: a revoked session cannot mint another token, so the old one dies with its life.
 */
export const PLATFORM_KINDS = ['web', 'mobile'] as const;
export type PlatformKind = (typeof PLATFORM_KINDS)[number];

/** `M01-07` — a web session is 30 days, rolling. */
export const WEB_SESSION_ROLLING_DAYS = 30;
/** `M01-07` — seven full days without foreground authenticated use expires a mobile session. */
export const MOBILE_IDLE_DAYS = 7;
/** `M01-07` — the API token's life, and therefore the revocation bound. */
export const API_TOKEN_MINUTES = 10;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** When a session opened at `now` on this platform expires, before any later use. */
export function sessionExpiresAt(kind: PlatformKind, now: number): number {
  return now + (kind === 'web' ? WEB_SESSION_ROLLING_DAYS : MOBILE_IDLE_DAYS) * MS_PER_DAY;
}

/**
 * The expiry a use at `now` moves a session to, or `null` when this use moves nothing: web
 * rolls on every use, mobile only on a foreground one.
 */
export function refreshedExpiry(
  kind: PlatformKind,
  now: number,
  foreground: boolean,
): number | null {
  if (kind === 'mobile' && !foreground) return null;
  return sessionExpiresAt(kind, now);
}

/** When a token minted at `now` stops being accepted. */
export function apiTokenExpiresAt(now: number): number {
  return now + API_TOKEN_MINUTES * MS_PER_MINUTE;
}

export interface SessionLife {
  readonly expiresAt: number;
  readonly revokedAt: number | null;
}

/** A session is live until its expiry, unless it was revoked first. */
export function isSessionLive(session: SessionLife, now: number): boolean {
  return session.revokedAt === null && now < session.expiresAt;
}
