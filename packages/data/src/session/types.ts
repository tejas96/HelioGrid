import type { OtpChannel, RolePreset } from '@heliogrid/contracts';
import type { OtpFailure } from '@heliogrid/domain';
import type { HeldWorkSummary } from './held-work';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';

export interface SessionUser {
  id: string;
  name: string;
  phoneE164: string;
  /** Null until a company exists — the signup that resumes at the company step (`M01-10`). */
  tenant: { id: string; roles: readonly RolePreset[] } | null;
}

/**
 * A different user verified on a device still holding another user's work (`F4-37`): the
 * switch waits here until the person whose work is named confirms it, and no data of the new
 * user loads before then.
 */
export interface PendingSwitch {
  readonly previousUserId: string;
  readonly heldWork: HeldWorkSummary;
  readonly next: SessionUser;
}

export interface SessionSnapshot {
  status: SessionStatus;
  user: SessionUser | null;
  switch: PendingSwitch | null;
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
 */
export interface SessionStore {
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): () => void;
  requestOtp(phoneE164: string, channel: OtpChannel): Promise<OtpResult>;
  /** Verifies the code of the challenge `requestOtp` opened; the store holds the challenge id. */
  verifyOtp(code: string): Promise<OtpResult>;
  /** Discards the previous user's held work and lets the pending switch complete (`F4-37`). */
  completeSwitch(): Promise<void>;
  signOut(): Promise<void>;
  signOutEverywhere(): Promise<void>;
}

/** What `useSession()` returns — the snapshot flattened onto the calls. */
export interface SessionApi extends SessionSnapshot {
  requestOtp(phoneE164: string, channel: OtpChannel): Promise<OtpResult>;
  verifyOtp(code: string): Promise<OtpResult>;
  completeSwitch(): Promise<void>;
  signOut(): Promise<void>;
  signOutEverywhere(): Promise<void>;
}
