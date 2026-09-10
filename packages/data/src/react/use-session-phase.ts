import type { SessionPhase, SessionStatus } from '../session/types';
import { useSession } from './use-session';
import { useSignInDwell } from './use-sign-in-dwell';

/** The one partition (Law 11): `checking` boots, a settled session is in, everything else is out. */
export function sessionPhase(status: SessionStatus, dwellOver: boolean): SessionPhase {
  if (status === 'checking') return 'booting';
  if (status === 'authenticated' && dwellOver) return 'signedIn';
  return 'signedOut';
}

/**
 * ONE phase value for a whole navigator. It owns a dwell timer, and two timers can disagree
 * for a frame — so a navigator calls this once and hands the value down, never once per guard.
 */
export function useSessionPhase(): SessionPhase {
  const { status } = useSession();
  const dwell = useSignInDwell(status);
  return sessionPhase(status, dwell === 'over');
}
