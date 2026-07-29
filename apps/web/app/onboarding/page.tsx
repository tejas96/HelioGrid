'use client';
import { type TenantSegment, tenantSegmentSchema } from '@heliogrid/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, envelopeMessage } from '../../lib/api-client';
import './styles.css';

/**
 * Segment copy keyed by the contract enum: adding a segment to `tenantSegmentSchema` is a
 * compile error HERE until this screen renders it. The old `as const` array was merely
 * subset-assignable, so a new segment shipped silently unselectable (Law 4 / UX drift).
 */
const SEGMENT_LABEL: Record<TenantSegment, string> = {
  residential: 'Homes',
  ci: 'Commercial & industrial',
  both: 'Both',
};

/** SignUpFlow/WhatYouSell — Stage-0: name the workspace, pick what you sell. */
export default function Onboarding() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');
  const [segment, setSegment] = useState<TenantSegment>('both');
  const [error, setError] = useState<string | null>(null);
  const onboarding = api.auth.completeOnboarding.useMutation();
  const busy = onboarding.isPending;

  const submit = async () => {
    setError(null);
    try {
      // Typed client: body and response are contract-checked at compile time. Non-2xx
      // rejects, so a resolved value is the declared 201 body — nothing else can compile.
      await onboarding.mutateAsync({
        body: { tenantName, userName, segment, language: 'en' },
      });
      router.push('/home');
    } catch (err) {
      setError(envelopeMessage(err) ?? 'Could not create the workspace.');
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--screen-pad-mobile)]">
      <section className="hg-card w-full max-w-md" aria-busy={busy}>
        <p className="hg-overline">Set up your workspace</p>
        <h1 className="hg-h1">What do you sell?</h1>
        <label className="hg-field-label" htmlFor="ob-name">
          Your name
        </label>
        <input
          id="ob-name"
          className="hg-input ob-input"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Full name"
        />
        <label className="hg-field-label" htmlFor="ob-company">
          Company name
        </label>
        <input
          id="ob-company"
          className="hg-input ob-input"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="e.g. Surya Solar Pune"
        />
        <span className="hg-field-label">Customer segment</span>
        <fieldset className="hg-seg" aria-label="Customer segment">
          {tenantSegmentSchema.options.map((key) => (
            <button
              key={key}
              type="button"
              className="hg-seg-chip"
              aria-pressed={segment === key}
              onClick={() => setSegment(key)}
            >
              {SEGMENT_LABEL[key]}
            </button>
          ))}
        </fieldset>
        {error ? (
          <p className="hg-error" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="hg-btn-primary w-full"
          disabled={busy || tenantName.length < 2 || userName.length < 1}
          onClick={submit}
        >
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
      </section>
    </main>
  );
}
