import type { PlatformKind, SessionProjection } from '@heliogrid/contracts';
import type { AuthRepository } from '../auth/repository';
import { ApiError, UnauthorizedError } from '../errors/errors';
import type { UserRepository } from '../user/repository';
import type { HeldWork } from './held-work';
import type { OtpResult, SessionSnapshot, SessionStore, SessionUser } from './types';

/** The refusals that mean "the code, not the connection" (`M01-04`). */
const CODE_REFUSALS = new Set(['OTP_MISMATCH', 'OTP_EXPIRED', 'OTP_INVALIDATED', 'OTP_LOCKED']);

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
  platform: PlatformKind;
  heldWork: HeldWork;
}): SessionStore {
  let snapshot: SessionSnapshot = { status: 'checking', user: null, switch: null };
  let challengeId: string | null = null;
  const listeners = new Set<() => void>();

  const emit = (next: SessionSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const signedIn = (user: SessionUser) => emit({ status: 'authenticated', user, switch: null });
  const signedOut = () => emit({ status: 'anonymous', user: null, switch: null });

  // The boot check runs on the FIRST subscription, never at construction: a cookie the server
  // still honours signs the person straight in, and a server render — which builds the store
  // but never subscribes — fires no request and rotates no visitor's cookies.
  let booted = false;
  const boot = () => {
    booted = true;
    config.auth
      .session()
      .then((projection) => signedIn(userOf(projection)))
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
    async requestOtp(phoneE164, channel): Promise<OtpResult> {
      try {
        const challenge = await config.auth.requestOtp(phoneE164, channel);
        challengeId = challenge.challengeId;
        return { ok: true };
      } catch {
        return { ok: false, failure: 'resend-failed' };
      }
    },
    async verifyOtp(code): Promise<OtpResult> {
      if (challengeId === null) return { ok: false, failure: 'verify-failed' };
      try {
        const next = userOf(await config.auth.verifyOtp(challengeId, code, config.platform));
        challengeId = null;
        const previous = snapshot.user;
        const heldWork =
          previous !== null && previous.id !== next.id ? await config.heldWork.summary() : null;
        if (previous !== null && heldWork !== null) {
          emit({
            status: 'anonymous',
            user: null,
            switch: { previousUserId: previous.id, heldWork, next },
          });
        } else {
          signedIn(next);
        }
        return { ok: true };
      } catch (error) {
        const refused =
          (error instanceof UnauthorizedError || error instanceof ApiError) &&
          CODE_REFUSALS.has(error.code);
        return { ok: false, failure: refused ? 'mismatch' : 'verify-failed' };
      }
    },
    async completeSwitch() {
      const pending = snapshot.switch;
      if (pending === null) return;
      await config.heldWork.discard();
      signedIn(pending.next);
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
