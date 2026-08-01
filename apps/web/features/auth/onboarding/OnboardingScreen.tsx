'use client';
import { type TenantSegment, tenantSegmentSchema } from '@heliogrid/contracts';
import { Button, Card, Input, SegmentedControl } from '@heliogrid/ui';
import { useOnboarding } from './hooks/use-onboarding';
import './onboarding.css';

/**
 * Segment copy keyed by the contract enum: adding a segment to `tenantSegmentSchema` is a
 * compile error HERE until this screen renders it. The old `as const` array was merely
 * subset-assignable, so a new segment shipped silently unselectable (one definition
 * per fact / UX drift).
 */
const SEGMENT_LABEL: Record<TenantSegment, string> = {
  residential: 'Homes',
  ci: 'Commercial & industrial',
  both: 'Both',
};

const SEGMENT_OPTIONS = tenantSegmentSchema.options.map((value) => ({
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
            error={vm.error ?? undefined}
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
