import type { SignInStep } from '@heliogrid/domain';
import { hasCompany } from './company';
import type { SessionSnapshot } from './types';

/** The panels company signup can show; both screens render exactly one, chosen here. */
export type SignupView = 'known' | 'done' | 'company' | 'code' | 'phone';

/**
 * Which panel the signup door shows, in the one order both screens keep (Law 11): a number that
 * already has a company first — the store holds the session anonymous behind it (`M01-08`) —
 * then a settled session, which belongs on the company step while it has no company (`M01-10`)
 * and is done once it has one, then the flow's own step.
 */
export function signupView(
  session: Pick<SessionSnapshot, 'status' | 'user' | 'known'>,
  step: SignInStep,
): SignupView {
  if (session.known !== null) return 'known';
  if (session.status === 'authenticated' && session.user !== null) {
    return hasCompany(session.user) ? 'done' : 'company';
  }
  return step === 'otp' ? 'code' : 'phone';
}
