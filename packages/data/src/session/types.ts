import type { CreateTenant, MeasurementSystem, OtpChannel, UiLanguage } from '@heliogrid/contracts';
import type {
  FirstRunCarry,
  GoogleResult,
  GoogleToken,
  InviteJoinOutcome,
  InviteJoinResult,
  OnboardingStep,
  OtpRequestOutcome,
  OtpVerifyResult,
  RolePreset,
  SessionSnapshot,
  SignInDoor,
} from '@heliogrid/domain';
import type { SessionSignals } from '../transport/transport';
import type { JoinedInvite } from './invite-join';

/**
 * Framework-free session state. It is a STORE, not a plain object: a bare `status` field
 * could never re-render a screen. The React layer reads it through useSyncExternalStore.
 */
export interface SessionStore {
  /**
   * What the TRANSPORT reports into (`SessionSignals`). Store MECHANICS, like `getSnapshot` and
   * `subscribe`: `SessionApi` drops all three, so no screen can reach them.
   */
  readonly signals: SessionSignals;
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): () => void;
  requestOtp(phoneE164: string, channel: OtpChannel): Promise<OtpRequestOutcome>;
  /**
   * Verifies the code of the challenge `requestOtp` opened; the store holds the challenge id. On
   * the signup door a number that already has a company is held as `known` rather than signed in.
   */
  verifyOtp(code: string, door?: SignInDoor): Promise<OtpVerifyResult>;
  /**
   * Signs in through Google (`M01-02`). With `code` null it asks whether the login is linked;
   * with a code, the code of the challenge `requestOtp` opened is the proof that links it to that
   * number. A session is admitted as a verify's is, the shared-device switch included (`F4-37`).
   */
  signInWithGoogle(token: GoogleToken, code: string | null): Promise<GoogleResult>;
  /**
   * The invite's one act (`M01-13`): checks the code of the challenge `requestOtp` opened, then
   * joins the company the link's token names, and only then admits the session — a verified number
   * admitted before the join would land on company signup. A refused code answers on the `code`
   * step, as `verifyOtp` does; a join that fails keeps the verified account for `retryJoin`.
   */
  joinWithInvite(token: string, code: string, invite: JoinedInvite): Promise<InviteJoinResult>;
  /** Sends the join alone after one failed on a right code; `failed` when no verified account waits. */
  retryJoin(token: string): Promise<InviteJoinOutcome>;
  /**
   * First-Run Profile, owed to the signed-in person after a join named their account from the
   * invite (`SCR-M01-09`); `null` otherwise. Memory only: a reload owes nothing. Store mechanics:
   * read through `useFirstRunProfile`, never `SessionApi`.
   */
  firstRunOwed(): FirstRunCarry | null;
  /**
   * What the join told the signed-in person — the company and who invited them — until the role
   * card's act (`SCR-M01-10`); `null` otherwise. Read through `useRoleCard`, never `SessionApi`.
   */
  firstRunCarry(): FirstRunCarry | null;
  /** First-Run Profile is saved: no longer owed, and the carry stays for the role card. */
  profileSaved(): void;
  /** The person moved on from the steps after a join: the role card's act. */
  endFirstRun(): void;
  /**
   * Asks the boot check again after it got no answer (`unreachable`); the cookie was never touched.
   * Resolves `false` when it still got none — `unreachable` stays, and the retry screen says so.
   */
  retryBoot(): Promise<boolean>;
  /**
   * Reads the signed-in person again — a write refused 403 means their presets changed on another
   * device — keeping the home they chose and the steps they put off. No answer changes nothing.
   */
  rereadUser(): Promise<void>;
  /** Discards the previous user's held work and lets the pending switch complete (`F4-37`). */
  completeSwitch(): Promise<void>;
  /** The person chose the account their number already has: it signs in (`M01-08`). */
  enterKnownAccount(): void;
  /** The person wants another number: the held account's session ends and the door is clear again. */
  leaveKnownAccount(): Promise<void>;
  /**
   * Company signup's last step (`M01-01`): the tenant, the owner membership and the owner role in
   * one server transaction, after which this session acts under the new company. Rejects with the
   * `DataError` the wire answered: nothing is created on a refusal, but after no answer the company
   * may exist — the same retry key then answers with it.
   */
  createCompany(input: CreateTenant): Promise<void>;
  signOut(): Promise<void>;
  /**
   * The person switched home for this session (`M13-09`). Memory only — a sign-out's snapshot
   * carries none — and a preset no longer held falls back to the ladder where it is read
   * (`composedHome`), never here.
   */
  chooseHome(preset: RolePreset): void;
  /**
   * The person went past this setup step without an answer saved; the steps after it are still
   * asked. Memory only, as `chooseHome`: the next sign-in's snapshot carries none, so the step is
   * asked again.
   */
  putOffSetup(step: OnboardingStep): void;
  signOutEverywhere(): Promise<void>;
  /**
   * The person chose a language (`F3-04`): the snapshot moves at once and the choice is
   * persisted through `PATCH /users/me`. Resolves true once the server holds it. A failed
   * persist keeps the choice for this mount — the server's value wins at the next sign-in —
   * because a switch that waits on a round trip, or undoes itself, is F3-04's own failure.
   */
  setInterfaceLanguage(next: UiLanguage): Promise<boolean>;
  /**
   * The person chose metres or feet (`F3-23`): as `setInterfaceLanguage`, the snapshot moves at
   * once and `PATCH /users/me` persists it; a refusal is held in `refusedPreferences`.
   */
  setUnitPreference(next: MeasurementSystem): Promise<boolean>;
}

/**
 * What `useSession()` returns — the snapshot flattened onto the calls.
 *
 * DERIVED, never restated: a tenth method on the store joins this type by itself. The two
 * members dropped are the store's own subscription mechanics, which a screen never touches —
 * `useSyncExternalStore` consumes them and hands the snapshot down.
 */
export type SessionApi = SessionSnapshot &
  Omit<
    SessionStore,
    | 'getSnapshot'
    | 'signals'
    | 'subscribe'
    | 'firstRunOwed'
    | 'firstRunCarry'
    | 'profileSaved'
    | 'endFirstRun'
  >;
