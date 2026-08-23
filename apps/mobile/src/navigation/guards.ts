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

/*
 * `useIsDevBuild` lived here and gated the Dev group. Removed 2026-08-19 with the v1
 * component gallery, which was the group's only member. It comes back
 * with the group and its `routes/dev.ts` map, not before — an exported hook nothing calls
 * is what knip exists to catch.
 */
