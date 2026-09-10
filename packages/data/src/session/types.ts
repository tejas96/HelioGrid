import type { CreateTenant, OtpChannel, RolePreset, UiLanguage } from '@heliogrid/contracts';
import type { OtpRequestOutcome, OtpVerifyOutcome } from '@heliogrid/domain';
import type { HeldWorkSummary } from './held-work';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';

/**
 * The three phases both navigators partition the session into: `booting` while the store is
 * still asking who the cookies belong to, `signedIn` once a session is settled, `signedOut` for
 * the anonymous visitor AND the sign-in beat — the door stays mounted while its done step plays.
 */
export type SessionPhase = 'booting' | 'signedOut' | 'signedIn';

export interface SessionUser {
  id: string;
  name: string;
  phoneE164: string;
  /** The person's own interface language (`F3-02`) — what the i18n provider follows. */
  interfaceLanguage: UiLanguage;
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

/**
 * Which door a code is verified on. The sign-in door signs the person straight in; the signup
 * door holds a number that already has a company back as a `KnownAccount` (`M01-08`), so the
 * person chooses before anything of that account loads.
 */
export type SignInDoor = 'sign-in' | 'signup';

/**
 * The signup door verified a number that already has a company (`M01-08`): the server session is
 * open, but the snapshot waits here — anonymous — until the person chooses to enter that account
 * or to leave it and start again with another number. Nothing of the account loads before then.
 */
export interface KnownAccount {
  readonly next: SessionUser;
}

export interface SessionSnapshot {
  status: SessionStatus;
  user: SessionUser | null;
  switch: PendingSwitch | null;
  known: KnownAccount | null;
  /**
   * The boot check found a live session on this device — the person is BACK, not newly signed
   * in — which is what a resumed signup greets (`M01-10`). False once a code verifies here.
   */
  restored: boolean;
}

/**
 * Outcome, not an exception: both login controllers branch on wrong-code (4xx) versus
 * transport failure, so the distinction belongs in the return type where typecheck sees it.
 * `failure` reuses domain's existing union — no new vocabulary.
 */
/**
 * How a code check ended, with the tries left ON THIS CODE — counted on the device, because the
 * challenge is this device's and a resend mints a new one; the server's count is the one that
 * invalidates (`T-M01-025`), this one is the one that speaks ("3 tries left on this code").
 */
export interface OtpVerifyResult {
  readonly outcome: OtpVerifyOutcome;
  readonly triesLeft: number;
}

/**
 * Framework-free session state. It is a STORE, not a plain object: a bare `status` field
 * could never re-render a screen. The React layer reads it through useSyncExternalStore.
 */
export interface SessionStore {
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): () => void;
  requestOtp(phoneE164: string, channel: OtpChannel): Promise<OtpRequestOutcome>;
  /**
   * Verifies the code of the challenge `requestOtp` opened; the store holds the challenge id. On
   * the signup door a number that already has a company is held as `known` rather than signed in.
   */
  verifyOtp(code: string, door?: SignInDoor): Promise<OtpVerifyResult>;
  /** Discards the previous user's held work and lets the pending switch complete (`F4-37`). */
  completeSwitch(): Promise<void>;
  /** The person chose the account their number already has: it signs in (`M01-08`). */
  enterKnownAccount(): void;
  /** The person wants another number: the held account's session ends and the door is clear again. */
  leaveKnownAccount(): Promise<void>;
  /**
   * Company signup's last step (`M01-01`): the tenant, the owner membership and the owner role in
   * one server transaction, after which this session acts under the new company. Rejects with the
   * `DataError` the wire answered; nothing is created on a rejection.
   */
  createCompany(input: CreateTenant): Promise<void>;
  signOut(): Promise<void>;
  signOutEverywhere(): Promise<void>;
  /**
   * The person chose a language (`F3-04`): the snapshot moves at once and the choice is
   * persisted through `PATCH /users/me`. Resolves true once the server holds it. A failed
   * persist keeps the choice for this mount — the server's value wins at the next sign-in —
   * because a switch that waits on a round trip, or undoes itself, is F3-04's own failure.
   */
  setInterfaceLanguage(next: UiLanguage): Promise<boolean>;
}

/** What `useSession()` returns — the snapshot flattened onto the calls. */
export interface SessionApi extends SessionSnapshot {
  requestOtp(phoneE164: string, channel: OtpChannel): Promise<OtpRequestOutcome>;
  verifyOtp(code: string, door?: SignInDoor): Promise<OtpVerifyResult>;
  completeSwitch(): Promise<void>;
  enterKnownAccount(): void;
  leaveKnownAccount(): Promise<void>;
  createCompany(input: CreateTenant): Promise<void>;
  signOut(): Promise<void>;
  signOutEverywhere(): Promise<void>;
  setInterfaceLanguage(next: UiLanguage): Promise<boolean>;
}
