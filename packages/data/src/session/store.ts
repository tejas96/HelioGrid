import type { PlatformKind, SessionProjection } from '@heliogrid/contracts';
import {
  OTP_MAX_FAILED_VERIFIES,
  type OtpRequestOutcome,
  type OtpVerifyOutcome,
} from '@heliogrid/domain';
import type { AuthRepository } from '../auth/repository';
import { ApiError } from '../errors/errors';
import type { TenantRepository } from '../tenant/repository';
import type { UserRepository } from '../user/repository';
import type { HeldWork } from './held-work';
import type {
  OtpVerifyResult,
  SessionSnapshot,
  SessionStore,
  SessionUser,
  SignInDoor,
} from './types';

/** The refusals that mean "the code, not the connection" (`M01-04`). */
/**
 * The wire's refusal codes (`packages/contracts/src/auth.ts`), each to the one word the door
 * renders a frame for. A code the wire did not name is `failed` — never guessed from a message.
 */
const REQUEST_OUTCOME_BY_CODE: Record<string, OtpRequestOutcome> = {
  OTP_COOLDOWN: 'cooldown',
  OTP_CAPPED: 'capped',
  OTP_LOCKED: 'locked',
  OTP_DELIVERY_FAILED: 'delivery-failed',
};
const VERIFY_OUTCOME_BY_CODE: Record<string, OtpVerifyOutcome> = {
  OTP_MISMATCH: 'mismatch',
  OTP_EXPIRED: 'expired',
  OTP_INVALIDATED: 'invalidated',
  OTP_LOCKED: 'locked',
};
function codeOf(error: unknown): string {
  return error instanceof ApiError ? error.code : '';
}

function userOf(projection: SessionProjection): SessionUser {
  return {
    id: projection.actor.userId,
    name: projection.actor.displayName,
    phoneE164: projection.actor.phoneE164,
    interfaceLanguage: projection.actor.interfaceLanguage,
    tenant:
      projection.membership === null
        ? null
        : { id: projection.membership.tenantId, roles: projection.membership.roles },
  };
}

/**
 * The real session store, authored ONCE for both platforms. It starts `checking` and asks the
 * server who the cookies belong to; the credentials themselves never pass through here — the
 * transport carries them. `verifyOtp` is where a shared device changes hands (`F4-37`).
 */
export function createSessionStore(config: {
  auth: AuthRepository;
  user: UserRepository;
  tenant: TenantRepository;
  platform: PlatformKind;
  heldWork: HeldWork;
}): SessionStore {
  let snapshot: SessionSnapshot = {
    status: 'checking',
    user: null,
    switch: null,
    known: null,
    restored: false,
  };
  let challengeId: string | null = null;
  let wrongTries = 0;
  const listeners = new Set<() => void>();

  const emit = (next: SessionSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const signedIn = (user: SessionUser, restored = false) =>
    emit({ status: 'authenticated', user, switch: null, known: null, restored });
  const signedOut = () =>
    emit({ status: 'anonymous', user: null, switch: null, known: null, restored: false });

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
      emit({
        status: 'anonymous',
        user: null,
        switch: { previousUserId: previous.id, heldWork, next },
        known: null,
        restored: false,
      });
      return;
    }
    if (door === 'signup' && next.tenant !== null) {
      emit({ status: 'anonymous', user: null, switch: null, known: { next }, restored: false });
      return;
    }
    signedIn(next);
  };

  // The boot check runs on the FIRST subscription, never at construction: a cookie the server
  // still honours signs the person straight in, and a server render — which builds the store
  // but never subscribes — fires no request and rotates no visitor's cookies.
  let booted = false;
  const boot = () => {
    booted = true;
    config.auth
      .session()
      .then((projection) => signedIn(userOf(projection), true))
      .catch(() => signedOut());
  };

  return {
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
        return REQUEST_OUTCOME_BY_CODE[codeOf(error)] ?? 'failed';
      }
    },
    async verifyOtp(code, door = 'sign-in'): Promise<OtpVerifyResult> {
      const triesLeft = () => Math.max(OTP_MAX_FAILED_VERIFIES - wrongTries, 0);
      if (challengeId === null) return { outcome: 'failed', triesLeft: triesLeft() };
      try {
        const next = userOf(await config.auth.verifyOtp(challengeId, code, config.platform));
        challengeId = null;
        await admit(next, door);
        return { outcome: 'verified', triesLeft: triesLeft() };
      } catch (error) {
        const outcome = VERIFY_OUTCOME_BY_CODE[codeOf(error)] ?? 'failed';
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
      try {
        await config.user.updateMe({ interfaceLanguage: next });
        return true;
      } catch {
        return false;
      }
    },
    async signOutEverywhere() {
      await config.auth.signOutEverywhere().catch(() => undefined);
      signedOut();
    },
  };
}
