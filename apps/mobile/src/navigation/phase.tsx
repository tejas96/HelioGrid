import { useLanding, useSessionPhase } from '@heliogrid/data/react';
import type { SessionLanding, SessionPhase } from '@heliogrid/domain';
import { createContext, type ReactNode, useContext } from 'react';

/**
 * ONE session/dwell value for the whole navigator, computed by `useSessionPhase` once here and
 * read by every guard through context. Deliberately not a hook per guard: two of the three
 * guards depend on whether the dwell has elapsed, and independent timers can disagree for a
 * frame. Both landing false while Boot is also false would leave the navigator with zero
 * screens, which THROWS ("Couldn't find any screens for the navigator"). One value makes the
 * partition exhaustive by construction rather than by three hooks agreeing.
 *
 * The landing is decided here once too, over that phase, for the same reason: it holds a read of
 * its own, and a guard per screen would each hold one.
 */
const NavigationPhaseContext = createContext<SessionPhase>('booting');
const NavigationLandingContext = createContext<SessionLanding>('wait');

export function NavigationPhaseProvider({ children }: { children: ReactNode }) {
  const phase = useSessionPhase();
  const landing = useLanding(phase);
  return (
    <NavigationPhaseContext.Provider value={phase}>
      <NavigationLandingContext.Provider value={landing}>
        {children}
      </NavigationLandingContext.Provider>
    </NavigationPhaseContext.Provider>
  );
}

export function useNavigationPhase() {
  return useContext(NavigationPhaseContext);
}

/** Where the person belongs (`useLanding`, the hook the web's gate reads), decided once per navigator render. */
export function useNavigationLanding() {
  return useContext(NavigationLandingContext);
}
