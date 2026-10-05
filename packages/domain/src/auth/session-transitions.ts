import type { SessionLoss, SessionSnapshot, SessionUser } from './session';

/**
 * Every move of the session both platforms read, as ONE pure decision (Law 11). The store in
 * `packages/data` only calls this: it holds the snapshot and the wire, never the rule. A move that
 * changes nothing returns the SAME snapshot, which is how the store knows to wake no listener.
 */
export type SessionEvent =
  /** A code verified, a known account entered, a switch completed, or the boot check found a session. */
  | { readonly kind: 'signed-in'; readonly user: SessionUser; readonly restored: boolean }
  | { readonly kind: 'signed-out' }
  /** The boot check failed. After a loss it found, that loss already said everything. */
  | { readonly kind: 'boot-failed' }
  /** The boot check found no credential: signed out, read the same way as a failed check. */
  | { readonly kind: 'boot-signed-out' }
  /** The transport's refresh was refused, and the server named why. */
  | { readonly kind: 'lost'; readonly loss: SessionLoss };

/** Where every device starts: asking the server who the cookies belong to. */
export const CHECKING: SessionSnapshot = {
  status: 'checking',
  user: null,
  switch: null,
  known: null,
  restored: false,
  chosenHome: null,
  ended: null,
};

/** The door, with nothing held. */
export const SIGNED_OUT: SessionSnapshot = { ...CHECKING, status: 'anonymous' };

export function sessionAfter(current: SessionSnapshot, event: SessionEvent): SessionSnapshot {
  switch (event.kind) {
    case 'signed-in':
      return { ...SIGNED_OUT, status: 'authenticated', user: event.user, restored: event.restored };
    case 'signed-out':
      return SIGNED_OUT;
    case 'boot-failed':
    case 'boot-signed-out':
      return current.status === 'checking' ? SIGNED_OUT : current;
    case 'lost':
      return afterLoss(current, event.loss);
  }
}

/**
 * A removal while signed in HOLDS the person, with its reason, so the shell can say what happened
 * (`S1.wrong.4`) instead of dropping them at a door that says nothing; they leave by signing out.
 * A removal found by the boot check has nobody to hold, so it goes to the door with the reason.
 * Every other loss opens the door. Once held or at the door, a later loss changes nothing — two
 * reads refused together report twice, and the second refresh can go out with a cookie the first
 * answer already cleared and come back `signed-out`.
 */
function afterLoss(current: SessionSnapshot, loss: SessionLoss): SessionSnapshot {
  if (current.status === 'anonymous' || current.ended !== null) return current;
  if (loss === 'signed-out') return SIGNED_OUT;
  if (current.status === 'authenticated') {
    return { ...current, ended: { tenantId: current.user?.tenant?.id ?? null } };
  }
  return { ...SIGNED_OUT, ended: { tenantId: null } };
}

/**
 * Whether a refused call is worth one refresh. Not once signed out or ended — a wrong OTP code
 * answers 401, and five tries would post five doomed refreshes; a held removal's cookies are
 * already cleared. The boot check says yes: a lapsed token comes back that way.
 */
export function canRenew(snapshot: SessionSnapshot): boolean {
  return snapshot.status !== 'anonymous' && snapshot.ended === null;
}
