import type { SessionPhase } from '@heliogrid/data';
import { useSessionPhase } from '@heliogrid/data/react';
import { createContext, type ReactNode, useContext } from 'react';

/**
 * ONE session/dwell value for the whole navigator, computed by `useSessionPhase` once here and
 * read by every guard through context. Deliberately not a hook per guard: two of the three
 * guards depend on whether the dwell has elapsed, and independent timers can disagree for a
 * frame. Both landing false while Boot is also false would leave the navigator with zero
 * screens, which THROWS ("Couldn't find any screens for the navigator"). One value makes the
 * partition exhaustive by construction rather than by three hooks agreeing.
 */
const NavigationPhaseContext = createContext<SessionPhase>('booting');

export function NavigationPhaseProvider({ children }: { children: ReactNode }) {
  return (
    <NavigationPhaseContext.Provider value={useSessionPhase()}>
      {children}
    </NavigationPhaseContext.Provider>
  );
}

export function useNavigationPhase() {
  return useContext(NavigationPhaseContext);
}
