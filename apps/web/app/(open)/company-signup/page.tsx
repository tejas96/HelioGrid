import { CompanySignupScreen } from '../../../features/company-signup';

/**
 * Route entry for /company-signup — routing only. The open group has no gate: the company step
 * opens to a new number before any session exists and to a signed-in person who has no company
 * yet (`M01-10`).
 */
export default function CompanySignupPage() {
  return <CompanySignupScreen />;
}
