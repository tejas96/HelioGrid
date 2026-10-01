import { hasCompany } from './company';
import type { EndedAccess, SessionPhase, SessionUser } from './session';

/**
 * Where a visitor belongs, as a DECISION rather than a route. Both platforms ask the same
 * question and answered it in different shapes: the web computed a path, the phone a pair of
 * booleans its navigator branched on, and `M01-10`'s rule — a verified number with no company
 * belongs on the company step, not inside — was written twice and could part.
 *
 * A route is each app's own (`/home` against a `Home` screen name), so it is not the shared
 * fact; the landing is. Each app maps these to its own destinations and nothing else.
 */
export type SessionLanding = 'wait' | 'door' | 'company-step' | 'home' | 'access-removed';

/**
 * `wait` while the store is still asking who the cookies belong to — nothing is known yet and
 * nothing may render. `door` for the anonymous visitor AND the sign-in beat, so "You are in" is
 * read before the home opens. A signed-in person whose access was removed is held on
 * `access-removed` (`S1.wrong.4`). Then `M01-10`: a company or the step that makes one.
 */
export function landingFor(
  phase: SessionPhase,
  user: SessionUser | null,
  ended: EndedAccess | null,
): SessionLanding {
  if (phase === 'booting') return 'wait';
  if (phase !== 'signedIn') return 'door';
  if (ended !== null) return 'access-removed';
  return hasCompany(user) ? 'home' : 'company-step';
}
