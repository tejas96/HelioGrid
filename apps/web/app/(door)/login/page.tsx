import { COMPANY_SIGNUP_ROUTE, SignInScreen } from '../../../features/auth';

/** Route entry for /login — routing only; the door lives in features/auth, its gate in this group's layout. */
export default function LoginPage() {
  return <SignInScreen companySignupHref={COMPANY_SIGNUP_ROUTE} />;
}
