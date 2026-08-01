'use client';
import { TENANT_SEGMENTS, type TenantSegment } from '@heliogrid/domain';
import { Button, Card, Input, SegmentedControl } from '@heliogrid/ui';
import { useOnboarding } from './hooks/use-onboarding';
import './onboarding.css';

/**
 * Segment copy keyed by the domain enum: adding a segment to `TENANT_SEGMENTS` is a
 * compile error HERE until this screen renders it. The old `as const` array declared
 * LOCALLY was merely subset-assignable, so a new segment shipped silently unselectable
 * (one definition per fact / UX drift) — the canonical list living one layer down is what
 * keeps the Record exhaustive.
 */
const SEGMENT_LABEL: Record<TenantSegment, string> = {
  residential: 'Homes',
  ci: 'Commercial & industrial',
  both: 'Both',
};

const SEGMENT_OPTIONS = TENANT_SEGMENTS.map((value) => ({
  value,
  label: SEGMENT_LABEL[value],
}));

/** SignUpFlow/WhatYouSell — Stage-0: name the workspace, pick what you sell. */
export function OnboardingScreen() {
  const vm = useOnboarding();

  return (
    <main className="flex min-h-dvh items-center justify-center p-[var(--screen-pad-mobile)]">
      <div className="ob-shell">
        <Card aria-busy={vm.busy}>
          <p className="ob-overline">Set up your workspace</p>
          <h1 className="ob-title">What do you sell?</h1>

          <Input
            label="Your name"
            value={vm.userName}
            onChange={(e) => vm.onUserNameChange(e.target.value)}
            placeholder="Full name"
          />
          <Input
            label="Company name"
            value={vm.tenantName}
            onChange={(e) => vm.onTenantNameChange(e.target.value)}
            placeholder="e.g. Surya Solar Pune"
          />

          <span className="ob-field-label">Customer segment</span>
          <SegmentedControl
            options={SEGMENT_OPTIONS}
            value={vm.segment}
            onChange={(value) => vm.onSegmentChange(value as TenantSegment)}
          />

          <div className="ob-submit">
            <Button fullWidth loading={vm.busy} disabled={!vm.canSubmit} onClick={vm.onSubmit}>
              {vm.busy ? 'Creating…' : 'Create workspace'}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
