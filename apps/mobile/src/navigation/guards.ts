import type { SessionLanding } from '@heliogrid/domain';
import { useNavigationLanding, useNavigationPhase } from './phase';

/**
 * The `if` hooks the static config calls. Each is a pure comparison against the ONE phase
 * value or the ONE landing decided over it — see phase.tsx for why a guard computes neither.
 *
 * React Navigation calls every one of these unconditionally on each navigator render, in
 * fixed declaration order, so they must obey the rules of hooks and stay cheap.
 *
 * Boot follows the landing's `wait`, not the phase alone: a signed-in owner whose setup progress
 * is still being read has no App screen on, and without Boot the navigator would be empty.
 */
export const useIsBooting = () => useNavigationLanding() === 'wait';
export const useIsSignedOut = () => useNavigationPhase() === 'signedOut';
export const useIsSignedIn = () => useNavigationPhase() === 'signedIn';

/** The App group's first screens: the shell, the step that makes a company, or a setup step that company owes. */
type AppEntry =
  | 'Shell'
  | 'CompanySetup'
  | 'SetupLanguage'
  | 'SetupWhatYouSell'
  | 'SetupCompanyProfile'
  | 'SetupInviteTeam'
  | 'SetupReady';

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
  'language-step': 'SetupLanguage',
  'what-you-sell-step': 'SetupWhatYouSell',
  'company-profile-step': 'SetupCompanyProfile',
  'invite-team-step': 'SetupInviteTeam',
  'ready-step': 'SetupReady',
};

/**
 * Inside the App group, WHICH first screen. The decision is domain's `landingFor`, so `M01-10`'s
 * rule (a verified number with no company belongs on the company step, not inside) is answered
 * once rather than twice in two shapes.
 */
const useEntry = (): AppEntry | null => {
  const landing = useNavigationLanding();
  return landing === 'wait' || landing === 'door' ? null : ROUTE_OF_LANDING[landing];
};
export const useShowsShell = () => useEntry() === 'Shell';
export const useHasNoTenant = () => useEntry() === 'CompanySetup';
export const useOwesLanguageStep = () => useEntry() === 'SetupLanguage';
export const useOwesWhatYouSellStep = () => useEntry() === 'SetupWhatYouSell';
export const useOwesCompanyProfileStep = () => useEntry() === 'SetupCompanyProfile';
export const useOwesInviteTeamStep = () => useEntry() === 'SetupInviteTeam';
export const useOwesReadyStep = () => useEntry() === 'SetupReady';
/** The doors the shell opens exist only while the person is inside, never while held. */
export const useHasHome = () => useNavigationLanding() === 'home';

/*
 * `useIsDevBuild` lived here and gated the Dev group. Removed with the v1
 * component gallery, which was the group's only member. It comes back
 * with the group and its `routes/dev.ts` map, not before — an exported hook nothing calls
 * is dead code.
 */
