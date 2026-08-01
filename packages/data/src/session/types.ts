import type { OtpFailure } from '@heliogrid/domain';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';

export interface SessionUser {
  id: string;
  name: string;
  phoneE164: string;
  /** Null until onboarding completes — the redirect rule both platforms already encode. */
  tenant: { id: string; name: string } | null;
}

export interface SessionSnapshot {
  status: SessionStatus;
  user: SessionUser | null;
}

/**
 * Outcome, not an exception: both login controllers branch on wrong-code (4xx) versus
 * transport failure, so the distinction belongs in the return type where typecheck sees it.
 * `failure` reuses domain's existing union — no new vocabulary.
 */
export type OtpResult = { ok: true } | { ok: false; failure: OtpFailure };

/**
 * Framework-free session state. It is a STORE, not a plain object: a bare `status` field
 * could never re-render a screen. The React layer reads it through useSyncExternalStore.
 * The Better Auth rebuild implements this interface and nothing in a screen changes.
 */
export interface SessionStore {
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): () => void;
  requestOtp(phoneE164: string): Promise<OtpResult>;
  verifyOtp(phoneE164: string, code: string): Promise<OtpResult>;
  signOut(): Promise<void>;
}

/** What `useSession()` returns — the snapshot flattened onto the three calls. */
export interface SessionApi extends SessionSnapshot {
  requestOtp(phoneE164: string): Promise<OtpResult>;
  verifyOtp(phoneE164: string, code: string): Promise<OtpResult>;
  signOut(): Promise<void>;
}
