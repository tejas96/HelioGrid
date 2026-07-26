'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '../../lib/auth-client';

const SEGMENTS = [
  { key: 'residential', label: 'Homes' },
  { key: 'ci', label: 'Commercial & industrial' },
  { key: 'both', label: 'Both' },
] as const;

/** SignUpFlow/WhatYouSell — Stage-0: name the workspace, pick what you sell. */
export default function Onboarding() {
  const router = useRouter();
  const [tenantName, setTenantName] = useState('');
  const [userName, setUserName] = useState('');
  const [segment, setSegment] = useState<'residential' | 'ci' | 'both'>('both');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { status, body } = await api<{ error?: { message: string } }>('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify({ tenantName, userName, segment, language: 'en' }),
    });
    setBusy(false);
    if (status !== 201) return setError(body.error?.message ?? 'Could not create the workspace.');
    router.push('/home');
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
          className="hg-input"
          style={{ marginTop: 'var(--sp-2)', fontFamily: 'var(--font-sans)' }}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Full name"
        />
        <label className="hg-field-label" htmlFor="ob-company">
          Company name
        </label>
        <input
          id="ob-company"
          className="hg-input"
          style={{ marginTop: 'var(--sp-2)', fontFamily: 'var(--font-sans)' }}
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="e.g. Surya Solar Pune"
        />
        <span className="hg-field-label">Customer segment</span>
        <fieldset className="hg-seg" aria-label="Customer segment">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              type="button"
              className="hg-seg-chip"
              aria-pressed={segment === s.key}
              onClick={() => setSegment(s.key)}
            >
              {s.label}
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
