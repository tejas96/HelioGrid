import { IN_FORMATS, OTP_LENGTH } from '@heliogrid/domain';
import type { OtpResult, SessionSnapshot, SessionStore, SessionUser } from './types';

/**
 * DELIBERATE STUB (owner ruling 2026-08-01). Auth was removed to greenfield and the login
 * designs on both platforms must stay walkable until the Better Auth rebuild lands. This
 * reaches NO server: it accepts any correctly shaped phone number and any OTP_LENGTH-digit
 * code. It is authored ONCE so neither app invents its own, and it is DELETED — not
 * adapted — when the real SessionStore implementation arrives.
 */
const WALKTHROUGH_USER: SessionUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Walkthrough User',
  phoneE164: `${IN_FORMATS.phone.dialCode}0000000000`,
  tenant: { id: '00000000-0000-0000-0000-000000000001', name: 'Walkthrough Workspace' },
};

export function createWalkthroughSession(): SessionStore {
  // Starts 'anonymous', not 'checking': there is no persisted session to check for. The
  // 'checking' state stays in SessionStatus because the real implementation needs it, and
  // RootNavigator keeps its boot-spinner branch for that arrival.
  let snapshot: SessionSnapshot = { status: 'anonymous', user: null };
  const listeners = new Set<() => void>();

  const emit = (next: SessionSnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async requestOtp(phoneE164): Promise<OtpResult> {
      const nsn = phoneE164.slice(IN_FORMATS.phone.dialCode.length);
      return nsn.length === IN_FORMATS.phone.nsnLength
        ? { ok: true }
        : { ok: false, failure: 'resend-failed' };
    },
    async verifyOtp(_phoneE164, code): Promise<OtpResult> {
      if (code.length !== OTP_LENGTH) return { ok: false, failure: 'mismatch' };
      emit({ status: 'authenticated', user: WALKTHROUGH_USER });
      return { ok: true };
    },
    async signOut() {
      emit({ status: 'anonymous', user: null });
    },
  };
}
