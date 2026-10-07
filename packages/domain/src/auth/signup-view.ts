import { hasCompany } from './company';
import type { SignInStep } from './login-state';
import type { SessionSnapshot } from './session';

/** The panels company signup can show; both screens render exactly one, chosen here. */
export type SignupView = 'known' | 'done' | 'sent' | 'join' | 'company' | 'code' | 'phone';

/**
 * Where the join steer stands (`M01-09`): `offered` once the company step's name and city match
 * a company that already exists, `sent` once the person asked its owner to add them. Creating a
 * company anyway clears it.
 */
export type JoinSteer = 'none' | 'offered' | 'sent';

/**
 * Which panel the signup door shows, in the one order both screens keep (Law 11): a number that
 * already has a company first — the store holds the session anonymous behind it (`M01-08`) —
 * then a settled session, which belongs on the company step while it has no company (`M01-10`)
 * and is done once it has one, then the flow's own step. The join steer only ever replaces the
 * company step.
 */
export function signupView(
  session: Pick<SessionSnapshot, 'status' | 'user' | 'known'>,
  step: SignInStep,
  steer: JoinSteer = 'none',
): SignupView {
  if (session.known !== null) return 'known';
  if (session.status === 'authenticated' && session.user !== null) {
    if (hasCompany(session.user)) return 'done';
    return COMPANY_STEP_VIEW[steer];
  }
  return step === 'otp' ? 'code' : 'phone';
}

const COMPANY_STEP_VIEW: Record<JoinSteer, SignupView> = {
  none: 'company',
  offered: 'join',
  sent: 'sent',
};
