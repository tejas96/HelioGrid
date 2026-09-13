import type { CreateTenant, OtpChannel, UiLanguage } from '@heliogrid/contracts';
import type {
  OtpRequestOutcome,
  OtpVerifyResult,
  SessionSnapshot,
  SignInDoor,
} from '@heliogrid/domain';

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

/**
 * What `useSession()` returns — the snapshot flattened onto the calls.
 *
 * DERIVED, never restated: a tenth method on the store joins this type by itself. The two
 * members dropped are the store's own subscription mechanics, which a screen never touches —
 * `useSyncExternalStore` consumes them and hands the snapshot down.
 */
export type SessionApi = SessionSnapshot & Omit<SessionStore, 'getSnapshot' | 'subscribe'>;
