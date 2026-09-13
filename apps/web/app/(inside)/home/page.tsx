import { HomeScreen } from '../../../features/home';

/** Route entry for /home — routing only; all composition is in features/home, the gate in this group's layout. */
export default function HomePage() {
  return <HomeScreen />;
}
