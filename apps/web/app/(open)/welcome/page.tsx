import { FirstRunProfileScreen } from '../../../features/onboarding';

/**
 * Route entry for /welcome — routing only. In the open group, because the step after a join draws
 * no shell (`SCR-M01-09` decision 5); the screen sends anyone it is not owed to home.
 */
export default function WelcomePage() {
  return <FirstRunProfileScreen />;
}
