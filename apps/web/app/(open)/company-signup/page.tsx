import { CompanySignupScreen } from '../../../features/auth';

/**
 * Route entry for /company-signup — routing only. The open group has no gate: the company step
 * opens to a new number before any session exists and to a signed-in person who has no company
 * yet (`M01-10`); the screen itself sends an owner who already has one home.
 */
export default function CompanySignupPage() {
  return <CompanySignupScreen />;
}
