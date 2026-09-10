import { hasCompany } from '@heliogrid/data';
import { useSession } from '@heliogrid/data/react';
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
 * Inside the App group, WHICH first screen: a person with a company lands on their home, a
 * verified number without one on the company step (`SCR-M01-01` decision 1, `T-M01-002`).
 */
export const useHasTenant = () => hasCompany(useSession().user);
export const useHasNoTenant = () => !hasCompany(useSession().user);

/*
 * `useIsDevBuild` lived here and gated the Dev group. Removed with the v1
 * component gallery, which was the group's only member. It comes back
 * with the group and its `routes/dev.ts` map, not before — an exported hook nothing calls
 * is dead code.
 */
