'use client';
import { Button, EmptyState } from '@heliogrid/ui';
import { Trans } from '@lingui/react';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import './signup.css';

/**
 * Placeholder for the SignUp flow (auth-tenancy roadmap task 3 replaces this page).
 * Exists so the login screen's "Create an account" exit never 404s (no broken exits).
 * Composed from the DS vocabulary only — no new visuals.
 */
export default function SignUpPage() {
  const router = useRouter();
  return (
    <main className="sg-page">
      <EmptyState
        icon={<Building2 size={28} strokeWidth={1.5} />}
        title={<Trans id="Company sign-up opens here" />}
        description={
          <Trans id="This part of HelioGrid is being finished right now. Sign in, or check back shortly." />
        }
        action={
          <Button variant="secondary" onClick={() => router.push('/login')}>
            <Trans id="Back to sign in" />
          </Button>
        }
      />
    </main>
  );
}
