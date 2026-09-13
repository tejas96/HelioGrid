import type { RolePreset } from '../authz/roles';
import type { UiLanguage } from '../format/languages';
import type { OtpVerifyOutcome } from './login-state';

/**
 * The session as both platforms READ it — the flow view-model `architecture.md` §4 step 3 puts
 * here, beside the lifetimes `session-policy.ts` decides. The STORE that produces a snapshot is
 * `packages/data`'s (step 4: a session store is data access); these are the shapes its readers
 * branch on, so a screen never learns the session's vocabulary from the layer that fetches it.
 *
 * `HeldWorkSummary` travels with `PendingSwitch` because it is part of what the switch asks the
 * person. The PORT that reads it — `HeldWork`, with its promises — stays in `packages/data`:
 * this package holds no storage.
 */

/**
 * What a device still holds for a user that has not reached the server (`F4-37`): captured
 * work waiting to upload. The sign-in flow consults it before it lets a DIFFERENT user in, so
 * the person whose work would be lost is told first. V1 holds nothing on the device — no
 * capture feature has landed — so the default answers empty; the first task that holds a
 * capture implements this and the warning gains its count.
 */
export interface HeldWorkSummary {
  readonly count: number;
  readonly capturedByUserId: string;
  readonly capturedAt: string;
}

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
