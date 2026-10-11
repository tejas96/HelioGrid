import { can } from '../authz/policy';
import type { OnboardingStep } from '../tenancy/onboarding-steps';
import type { SessionUser } from './session';

/** The company's setup progress as a device holds it: still being read, not answered, or read. */
export type SetupRead =
  | { readonly status: 'pending' | 'failed' }
  | { readonly status: 'ready'; readonly resumeStep: OnboardingStep | null };

/**
 * `wait` while the answer is not known and nothing may render; the step that is owed, of the steps
 * that have a screen; `null` when the session owes none.
 */
export type SetupStepOwed = 'wait' | 'language' | null;

/**
 * The setup step a signed-in session is asked for (`M01-10`), decided once for both apps. Only a
 * person whose roles manage the company's settings is asked — the api refuses everyone else the
 * read — and only for a step that has a screen: the company resumes at later steps too, and a
 * session sent to a step nothing draws would have nowhere to go. A read that got no answer and a
 * session that put the step off owe nothing: setup never holds a person out of their home.
 */
export function setupStepOwed(
  user: SessionUser | null,
  putOff: boolean,
  read: SetupRead,
): SetupStepOwed {
  if (!managesSetup(user) || putOff) return null;
  if (read.status !== 'ready') return read.status === 'pending' ? 'wait' : null;
  return read.resumeStep === 'language' ? 'language' : null;
}

function managesSetup(user: SessionUser | null): boolean {
  if (user === null || user.tenant === null) return false;
  return can(user.tenant.roles, 'onboarding.manage_tenant_settings');
}
