'use client';
import { type TenantSegment, tenantSegmentSchema } from '@heliogrid/contracts';
import { useOnboarding } from './hooks/use-onboarding';
import './onboarding.css';

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
export function OnboardingScreen() {
  const vm = useOnboarding();

  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--screen-pad-mobile)]">
      <section className="hg-card w-full max-w-md" aria-busy={vm.busy}>
        <p className="hg-overline">Set up your workspace</p>
        <h1 className="hg-h1">What do you sell?</h1>
        <label className="hg-field-label" htmlFor="ob-name">
          Your name
        </label>
        <input
          id="ob-name"
          className="hg-input ob-input"
          value={vm.userName}
          onChange={(e) => vm.onUserNameChange(e.target.value)}
          placeholder="Full name"
        />
        <label className="hg-field-label" htmlFor="ob-company">
          Company name
        </label>
        <input
          id="ob-company"
          className="hg-input ob-input"
          value={vm.tenantName}
          onChange={(e) => vm.onTenantNameChange(e.target.value)}
          placeholder="e.g. Surya Solar Pune"
        />
        <span className="hg-field-label">Customer segment</span>
        <fieldset className="hg-seg" aria-label="Customer segment">
          {tenantSegmentSchema.options.map((key) => (
            <button
              key={key}
              type="button"
              className="hg-seg-chip"
              aria-pressed={vm.segment === key}
              onClick={() => vm.onSegmentChange(key)}
            >
              {SEGMENT_LABEL[key]}
            </button>
          ))}
        </fieldset>
        {vm.error ? (
          <p className="hg-error" role="alert">
            {vm.error}
          </p>
        ) : null}
        <button
          type="button"
          className="hg-btn-primary w-full"
          disabled={!vm.canSubmit}
          onClick={vm.onSubmit}
        >
          {vm.busy ? 'Creating…' : 'Create workspace'}
        </button>
      </section>
    </main>
  );
}
