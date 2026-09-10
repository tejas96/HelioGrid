'use client';
import { EmptyState } from '@heliogrid/ui';
import './CompanySignupScreen.css';

/**
 * Placeholder for `T-M01-002`'s company step, so the door and the dwell have a route to hand to.
 * Temporary copy exemption: the real screen wraps its words when it is built.
 */
export function CompanySignupScreen() {
  return (
    <main className="hg-company-signup-screen">
      <EmptyState title="Company signup" description={PLACEHOLDER_NOTE} />
    </main>
  );
}

const PLACEHOLDER_NOTE = 'Placeholder route. The screen is not built yet.';
