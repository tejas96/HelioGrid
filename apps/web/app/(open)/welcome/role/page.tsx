import { RoleExplainerScreen } from '../../../../features/onboarding';

/**
 * Route entry for /welcome/role — routing only. In the open group, because the role card at first
 * run draws no shell (`SCR-M01-10`); the screen sends anyone with no role to read home.
 */
export default function WelcomeRolePage() {
  return <RoleExplainerScreen />;
}
