import { useSession } from '@heliogrid/data/react';
import { DONE_DWELL_MS } from '@heliogrid/domain';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

/**
 * ONE session/dwell value for the whole navigator.
 *
 * Deliberately not three hooks each owning a timer: two of the three guards depend on whether
 * the dwell has elapsed, and independent timers can disagree for a frame. Both landing false
 * while Boot is also false would leave the navigator with zero screens, which THROWS
 * ("Couldn't find any screens for the navigator"). Computing one value makes the partition
 * exhaustive by construction rather than by three hooks agreeing.
 */
type NavigationPhase = 'booting' | 'signedOut' | 'signedIn';

const NavigationPhaseContext = createContext<NavigationPhase>('booting');

type SessionStatus = ReturnType<typeof useSession>['status'];

/**
 * The three phases partition SessionStatus exactly — 'checking' | 'anonymous' |
 * 'authenticated' crossed with the dwell. `signedOut` covering the dwell window is
 * deliberate, not an overlap: it keeps the login screen mounted while its done step plays.
 */
function resolvePhase(status: SessionStatus, dwellElapsed: boolean): NavigationPhase {
  if (status === 'checking') return 'booting';
  if (status === 'authenticated' && dwellElapsed) return 'signedIn';
  return 'signedOut';
}

/**
 * The swap to the authenticated group is DELAYED by DONE_DWELL_MS. Authentication is instant,
 * but the login screen's done step has to be visible for the design to survive — on web the
 * equivalent pause is a `router.push` the login controller schedules. Timing and navigation
 * are the app's job; the store only decides whether the user is authenticated.
 */
export function NavigationPhaseProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setDwellElapsed(false);
      return;
    }
    const timer = setTimeout(() => setDwellElapsed(true), DONE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <NavigationPhaseContext.Provider value={resolvePhase(status, dwellElapsed)}>
      {children}
    </NavigationPhaseContext.Provider>
  );
}

export function useNavigationPhase() {
  return useContext(NavigationPhaseContext);
}
