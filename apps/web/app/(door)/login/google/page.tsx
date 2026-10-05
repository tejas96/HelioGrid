import { COMPANY_SIGNUP_ROUTE, SignInScreen } from '../../../../features/auth';

/** Route entry for /login/google — Google's sign-in page sends the tab back here; the same door reads its answer. */
export default function GoogleReturnPage() {
  return <SignInScreen companySignupHref={COMPANY_SIGNUP_ROUTE} />;
}
