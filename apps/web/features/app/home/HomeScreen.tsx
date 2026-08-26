'use client';
import { EmptyState } from '@heliogrid/ui';
import './HomeScreen.css';

/**
 * Placeholder home screen — built on the V2 design system. Copy replaced by the real screen.
 * Temporary copy exemption: the i18n track wraps this when the real screen is designed.
 */
export function HomeScreen() {
  return (
    <main className="hg-home-screen">
      <EmptyState title="Home" description={PLACEHOLDER_NOTE} />
    </main>
  );
}

const PLACEHOLDER_NOTE = 'Placeholder route. The screen is not built yet.';
