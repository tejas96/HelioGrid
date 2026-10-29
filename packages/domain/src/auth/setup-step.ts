import { can } from '../authz/policy';
import type { Read } from '../shell/read';
import { type OnboardingStep, resumeStep, type StepStates } from '../tenancy/onboarding-steps';
import type { SessionUser } from './session';

/** The setup steps that have a screen. A step joins when its screen lands, never before. */
const STEPS_WITH_A_SCREEN = [
  'language',
  'what_you_sell',
  'business_profile',
  'invite_team',
  'ready',
] as const satisfies readonly OnboardingStep[];
export type SetupScreenStep = (typeof STEPS_WITH_A_SCREEN)[number];

/**
 * `wait` while the answer is not known and nothing may render; the step that is owed, of the steps
 * that have a screen; `null` when the session owes none.
 */
export type SetupStepOwed = 'wait' | SetupScreenStep | null;

/**
 * The setup step a signed-in session is asked for (`M01-10`), decided once for both apps. Only a
 * person whose roles manage the company's settings is asked — the api refuses everyone else the
 * read — and only for a step that has a screen: the company resumes at later steps too, and a
 * session sent to a step nothing draws would have nowhere to go. A step the session put off is
 * passed over and the next one asked, and a read that got no answer owes nothing: setup never
 * holds a person out of their home.
 */
export function setupStepOwed(
  user: SessionUser | null,
  putOff: readonly OnboardingStep[],
  progress: Read<StepStates>,
): SetupStepOwed {
  if (!managesSetup(user)) return null;
  if (progress.kind === 'loading') return 'wait';
  if (progress.kind !== 'ready') return null;
  const asked = resumeStep(progress.value, putOff);
  return STEPS_WITH_A_SCREEN.find((step) => step === asked) ?? null;
}

/**
 * The demo door of *You're ready* (`SCR-M01-06`, `M01-26`): the demo project being read, ready to
 * open, or not there. One vocabulary for the hook that reads it and the card that draws it.
 */
export type DemoDoor = 'loading' | 'ready' | 'unavailable';

/** Whether this person is asked for setup at all — and so whether a device reads its progress for them. */
export function managesSetup(user: SessionUser | null): boolean {
  if (user === null || user.tenant === null) return false;
  return can(user.tenant.roles, 'onboarding.manage_tenant_settings');
}
