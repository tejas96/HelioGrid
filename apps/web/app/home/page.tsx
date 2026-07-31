'use client';
import { HomeScreen } from '../../features/home';

/** Route only — the screen lives in features/home (ADR-0022). */
export default function HomePage() {
  return <HomeScreen />;
}
