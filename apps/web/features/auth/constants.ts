import type { SessionLanding } from '@heliogrid/domain';

/** The routes the doors send people between — `/login`, `/company-signup` and where a signed-in person belongs. */
export const LOGIN_ROUTE = '/login';
export const HOME_ROUTE = '/home';
export const COMPANY_SIGNUP_ROUTE = '/company-signup';

/**
 * This app's route for each landing `landingFor` can answer. The DECISION is domain's and the
 * phone reads the same one; only these paths are web's.
 *
 * `wait` is excluded because it is not a destination — nothing is known yet and nothing renders.
 * `access-removed` is excluded because the web has no frame for it yet (`T-SHELL-008`): the gate
 * signs the person out instead, and the plain door follows.
 * Typed as a `Record` rather than left to inference, so a landing added in domain fails to
 * compile HERE, naming the missing key, instead of surfacing as an index error at the call site.
 */
export const ROUTE_OF: Record<Exclude<SessionLanding, 'wait' | 'access-removed'>, string> = {
  door: LOGIN_ROUTE,
  'company-step': COMPANY_SIGNUP_ROUTE,
  home: HOME_ROUTE,
};
