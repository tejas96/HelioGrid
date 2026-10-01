import { useSession } from '@heliogrid/data/react';
import { landingFor, type SessionLanding } from '@heliogrid/domain';
import { useNavigationPhase } from './phase';

/**
 * The `if` hooks the static config calls. Each is a pure comparison against the ONE phase
 * value — see phase.tsx for why they must not compute the dwell themselves.
 *
 * React Navigation calls every one of these unconditionally on each navigator render, in
 * fixed declaration order, so they must obey the rules of hooks and stay cheap.
 */
export const useIsBooting = () => useNavigationPhase() === 'booting';
export const useIsSignedOut = () => useNavigationPhase() === 'signedOut';
export const useIsSignedIn = () => useNavigationPhase() === 'signedIn';

/** The App group's first screens: the shell, or the step that makes a company. */
type AppEntry = 'Shell' | 'CompanySetup';

/**
 * Which first screen each landing inside the App group mounts. The shell holds a person whose
 * access was removed (`S1.wrong.4`), so it mounts for that landing too. A `Record` over the
 * landings, so a landing added in domain fails to compile HERE instead of emptying the group —
 * an empty navigator is a hard throw.
 */
const ROUTE_OF_LANDING: Record<Exclude<SessionLanding, 'wait' | 'door'>, AppEntry> = {
  home: 'Shell',
  'access-removed': 'Shell',
  'company-step': 'CompanySetup',
};

/**
 * Inside the App group, WHICH first screen. The decision is `landingFor` — the same function
 * the web's gate reads, so `M01-10`'s rule (a verified number with no company belongs on the
 * company step, not inside) is answered once rather than twice in two shapes.
 */
const useLanding = () => {
  const { user, ended } = useSession();
  return landingFor(useNavigationPhase(), user, ended);
};
const useEntry = (): AppEntry | null => {
  const landing = useLanding();
  return landing === 'wait' || landing === 'door' ? null : ROUTE_OF_LANDING[landing];
};
export const useShowsShell = () => useEntry() === 'Shell';
export const useHasNoTenant = () => useEntry() === 'CompanySetup';
/** The doors the shell opens exist only while the person is inside, never while held. */
export const useHasHome = () => useLanding() === 'home';

/*
 * `useIsDevBuild` lived here and gated the Dev group. Removed with the v1
 * component gallery, which was the group's only member. It comes back
 * with the group and its `routes/dev.ts` map, not before — an exported hook nothing calls
 * is dead code.
 */
