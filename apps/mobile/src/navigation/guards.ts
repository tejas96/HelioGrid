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
 * Gates the Dev group; independent of session phase. Note this hides the route, it does not
 * strip the screen from the bundle — routes/dev.ts still imports it statically.
 */
export const useIsDevBuild = () => __DEV__;
