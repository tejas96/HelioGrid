import type { PlatformKind, UpdateUserProfile } from '@heliogrid/contracts';
import {
  CHECKING,
  type GoogleResult,
  OTP_MAX_FAILED_VERIFIES,
  type OtpRequestOutcome,
  type OtpVerifyResult,
  type ProfilePreference,
  type SessionEvent,
  type SessionSnapshot,
  type SessionUser,
  SIGNED_OUT,
  type SignInDoor,
  sessionAfter,
} from '@heliogrid/domain';
import type { AuthRepository } from '../auth/repository';
import { isUnanswered, UnauthorizedError } from '../errors/errors';
import type { InvitationRepository } from '../invitation/repository';
import type { TenantRepository } from '../tenant/repository';
import type { UserRepository } from '../user/repository';
import { createFirstRunHold } from './first-run';
import type { HeldWork } from './held-work';
import { type CodeCheck, createInviteJoin } from './invite-join';
import { createRenewal } from './renewal';
import type { SessionStore } from './types';
import {
  codeOf,
  GOOGLE_OUTCOME_BY_CODE,
  googleSignInBody,
  REQUEST_OUTCOME_BY_CODE,
  userOf,
  VERIFY_OUTCOME_BY_CODE,
} from './wire-answers';

/**
 * The real session store, authored ONCE for both platforms. It starts `checking` and asks the
 * server who the cookies belong to; the credentials themselves never pass through here — the
 * transport carries them. `verifyOtp`, `signInWithGoogle` and the invite's join are where a shared
 * device changes hands (`F4-37`).
 */
export function createSessionStore(config: {
  auth: AuthRepository;
  user: UserRepository;
  tenant: TenantRepository;
  invitation: InvitationRepository;
  platform: PlatformKind;
  heldWork: HeldWork;
}): SessionStore {
  let snapshot: SessionSnapshot = CHECKING;
  let challengeId: string | null = null;
  let wrongTries = 0;
  const triesLeft = () => Math.max(OTP_MAX_FAILED_VERIFIES - wrongTries, 0);
  const listeners = new Set<() => void>();

  const emit = (next: SessionSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  /**
   * Persists one of the person's own preferences after the snapshot already moved. One
   * preference's writes go out one after another, so the server ends on the last tap; only the
   * last tap's answer speaks, and only to the person who tapped: a refusal is held as
   * `refusedPreferences` for the control that made the choice, beside any other refused one, and
   * the next save of it that lands clears it. A queued write whose person signed out meanwhile never goes out under the next
   * person's cookies. Two quick taps whose answers came back out of order would otherwise show the
   * refusal on a value that was stored (`packages/data/CLAUDE.md`, Traps).
   */
  const preferenceSaves: Record<ProfilePreference, { latest: number; queue: Promise<unknown> }> = {
    language: { latest: 0, queue: Promise.resolve() },
    units: { latest: 0, queue: Promise.resolve() },
  };
  const savePreference = async (
    kind: ProfilePreference,
    patch: UpdateUserProfile,
  ): Promise<boolean> => {
    const saves = preferenceSaves[kind];
    saves.latest += 1;
    const ticket = saves.latest;
    const savedBy = snapshot.user?.id;
    const answer = saves.queue.then(() =>
      snapshot.user?.id !== savedBy
        ? false
        : config.user.updateMe(patch).then(
            () => true,
            () => false,
          ),
    );
    saves.queue = answer;
    const saved = await answer;
    if (ticket !== saves.latest || snapshot.user?.id !== savedBy) return saved;
    const refused = snapshot.refusedPreferences.includes(kind);
    if (!saved && !refused) {
      emit({ ...snapshot, refusedPreferences: [...snapshot.refusedPreferences, kind] });
    } else if (saved && refused) {
      emit({
        ...snapshot,
        refusedPreferences: snapshot.refusedPreferences.filter((other) => other !== kind),
      });
    }
    return saved;
  };

  /** Every move is domain's `sessionAfter`; one that changes nothing wakes no listener. */
  const apply = (event: SessionEvent) => {
    const next = sessionAfter(snapshot, event);
    if (next !== snapshot) emit(next);
  };
  const signedIn = (user: SessionUser, restored = false) =>
    apply({ kind: 'signed-in', user, restored });
  const signedOut = () => apply({ kind: 'signed-out' });

  const renewal = createRenewal({ auth: config.auth, snapshot: () => snapshot, apply });

  /**
   * Where a verified account goes: behind the switch on a shared device still holding another
   * user's work (`F4-37`); held back at the signup door when it already has a company, so the
   * person chooses (`M01-08`); otherwise straight in.
   */
  const admit = async (next: SessionUser, door: SignInDoor): Promise<void> => {
    const previous = snapshot.user;
    const heldWork =
      previous !== null && previous.id !== next.id ? await config.heldWork.summary() : null;
    if (previous !== null && heldWork !== null) {
      emit({ ...SIGNED_OUT, switch: { previousUserId: previous.id, heldWork, next } });
      return;
    }
    if (door === 'signup' && next.tenant !== null) {
      emit({ ...SIGNED_OUT, known: { next } });
      return;
    }
    signedIn(next);
  };

  /** Checks the code of the challenge `requestOtp` opened; the account it proves is not admitted here. */
  const checkCode = async (code: string): Promise<CodeCheck> => {
    if (challengeId === null) return { kind: 'refused', outcome: 'failed', triesLeft: triesLeft() };
    try {
      const user = userOf(await config.auth.verifyOtp(challengeId, code, config.platform));
      challengeId = null;
      return { kind: 'verified', user };
    } catch (error) {
      if (isUnanswered(error))
        return { kind: 'refused', outcome: 'unreached', triesLeft: triesLeft() };
      const outcome = VERIFY_OUTCOME_BY_CODE[codeOf(error)] ?? 'failed';
      if (outcome === 'mismatch') wrongTries += 1;
      return { kind: 'refused', outcome, triesLeft: triesLeft() };
    }
  };
  const firstRun = createFirstRunHold();
  const inviteJoin = createInviteJoin({
    invitation: config.invitation,
    checkCode,
    admit: (user) => admit(user, 'sign-in'),
    firstRun,
  });

  // The boot check runs on the FIRST subscription, never at construction: a cookie the server
  // still honours signs the person straight in, and a server render — which builds the store
  // but never subscribes — fires no request and rotates no visitor's cookies.
  // A 401 the transport could not turn into a loss is still no session: it opens the door, never
  // the retry, or every Try again would meet the same 401. Resolves whether the check was answered.
  const checkSession = (): Promise<boolean> =>
    config.auth
      .session()
      .then(
        (projection) => {
          if (projection === null) apply({ kind: 'boot-signed-out' });
          else signedIn(userOf(projection), true);
          return true;
        },
        (error: unknown) => {
          apply({ kind: error instanceof UnauthorizedError ? 'boot-signed-out' : 'boot-failed' });
          return error instanceof UnauthorizedError;
        },
      )
      // A throw while admitting the answer is no session either; it never leaves the boot hanging.
      .catch(() => {
        apply({ kind: 'boot-failed' });
        return false;
      });
  let booted = false;
  const boot = () => {
    booted = true;
    void checkSession();
  };

  return {
    signals: renewal.signals,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      if (!booted) boot();
      return () => {
        listeners.delete(listener);
      };
    },
    async requestOtp(phoneE164, channel): Promise<OtpRequestOutcome> {
      try {
        const challenge = await config.auth.requestOtp(phoneE164, channel);
        challengeId = challenge.challengeId;
        wrongTries = 0;
        return 'sent';
      } catch (error) {
        if (isUnanswered(error)) return 'unreached';
        return REQUEST_OUTCOME_BY_CODE[codeOf(error)] ?? 'failed';
      }
    },
    async verifyOtp(code, door = 'sign-in'): Promise<OtpVerifyResult> {
      const check = await checkCode(code);
      if (check.kind === 'refused') return { outcome: check.outcome, triesLeft: check.triesLeft };
      try {
        await admit(check.user, door);
        return { outcome: 'verified', triesLeft: triesLeft() };
      } catch {
        return { outcome: 'failed', triesLeft: triesLeft() };
      }
    },
    joinWithInvite: inviteJoin.joinWithInvite,
    retryJoin: inviteJoin.retryJoin,
    firstRunOwed: () => firstRun.owedTo(snapshot.user),
    endFirstRun: firstRun.end,
    retryBoot: checkSession,
    rereadUser: renewal.rereadUser,
    async signInWithGoogle(token, code): Promise<GoogleResult> {
      // A link proves a number by the code of the challenge this store opened; without one there is nothing to prove.
      if (code !== null && challengeId === null)
        return { outcome: 'failed', triesLeft: triesLeft() };
      const link = code === null || challengeId === null ? undefined : { challengeId, code };
      try {
        const projection = await config.auth.signInWithProvider(
          'google',
          googleSignInBody(token, config.platform, link),
        );
        if (link !== undefined) challengeId = null;
        await admit(userOf(projection), 'sign-in');
        return { outcome: 'signed-in', triesLeft: triesLeft() };
      } catch (error) {
        const outcome = GOOGLE_OUTCOME_BY_CODE[codeOf(error)] ?? 'failed';
        if (outcome === 'mismatch') wrongTries += 1;
        return { outcome, triesLeft: triesLeft() };
      }
    },
    async completeSwitch() {
      const pending = snapshot.switch;
      if (pending === null) return;
      await config.heldWork.discard();
      signedIn(pending.next);
    },
    enterKnownAccount() {
      if (snapshot.known !== null) signedIn(snapshot.known.next);
    },
    /** The held session is real on the server, so leaving it is a sign-out, not a forget. */
    async leaveKnownAccount() {
      if (snapshot.known === null) return;
      await config.auth.signOut().catch(() => undefined);
      signedOut();
    },
    async createCompany(input) {
      signedIn(userOf(await config.tenant.create(input)));
    },
    async signOut() {
      await config.auth.signOut().catch(() => undefined);
      signedOut();
    },
    /**
     * Optimistic on purpose (`F3-04`): the snapshot moves first and the server catches up. A
     * failed persist leaves the choice standing — the server's value wins at the next sign-in —
     * because a switch that waits on a round trip, or undoes itself, is the failure F3-04 names.
     */
    async setInterfaceLanguage(next) {
      const user = snapshot.user;
      if (user === null) return false;
      if (user.interfaceLanguage !== next) {
        emit({ ...snapshot, user: { ...user, interfaceLanguage: next } });
      }
      return savePreference('language', { interfaceLanguage: next });
    },
    async setUnitPreference(next) {
      const user = snapshot.user;
      if (user === null) return false;
      if (user.unitPreference !== next) {
        emit({ ...snapshot, user: { ...user, unitPreference: next } });
      }
      return savePreference('units', { unitPreference: next });
    },
    chooseHome(preset) {
      if (snapshot.status === 'authenticated') emit({ ...snapshot, chosenHome: preset });
    },
    putOffSetup(step) {
      if (snapshot.status !== 'authenticated' || snapshot.setupPutOff.includes(step)) return;
      emit({ ...snapshot, setupPutOff: [...snapshot.setupPutOff, step] });
    },
    async signOutEverywhere() {
      await config.auth.signOutEverywhere().catch(() => undefined);
      signedOut();
    },
  };
}
