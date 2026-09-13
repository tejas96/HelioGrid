import { useSession } from '@heliogrid/data/react';
import { landingFor } from '@heliogrid/domain';
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

/**
 * Inside the App group, WHICH first screen. The decision is `landingFor` — the same function
 * the web's gate reads, so `M01-10`'s rule (a verified number with no company belongs on the
 * company step, not inside) is answered once rather than twice in two shapes.
 */
const useLanding = () => landingFor(useNavigationPhase(), useSession().user);
export const useHasTenant = () => useLanding() === 'home';
export const useHasNoTenant = () => useLanding() === 'company-step';

/*
 * `useIsDevBuild` lived here and gated the Dev group. Removed with the v1
 * component gallery, which was the group's only member. It comes back
 * with the group and its `routes/dev.ts` map, not before — an exported hook nothing calls
 * is dead code.
 */
