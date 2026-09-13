import { hasCompany } from './company';
import type { SessionPhase, SessionUser } from './session';

/**
 * Where a visitor belongs, as a DECISION rather than a route. Both platforms ask the same
 * question and answered it in different shapes: the web computed a path, the phone a pair of
 * booleans its navigator branched on, and `M01-10`'s rule — a verified number with no company
 * belongs on the company step, not inside — was written twice and could part.
 *
 * A route is each app's own (`/home` against a `Home` screen name), so it is not the shared
 * fact; the landing is. Each app maps these four to its own destinations and nothing else.
 */
export type SessionLanding = 'wait' | 'door' | 'company-step' | 'home';

/**
 * `wait` while the store is still asking who the cookies belong to — nothing is known yet and
 * nothing may render. `door` for the anonymous visitor AND the sign-in beat, so "You are in" is
 * read before the home opens. Then `M01-10`: a company or the step that makes one.
 */
export function landingFor(phase: SessionPhase, user: SessionUser | null): SessionLanding {
  if (phase === 'booting') return 'wait';
  if (phase !== 'signedIn') return 'door';
  return hasCompany(user) ? 'home' : 'company-step';
}
