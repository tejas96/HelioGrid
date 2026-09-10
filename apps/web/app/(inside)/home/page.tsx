import { HomeScreen } from '../../../features/app/home';

/** Route entry for /home — routing only; all composition is in features/app/home, the gate in this group's layout. */
export default function HomePage() {
  return <HomeScreen />;
}
