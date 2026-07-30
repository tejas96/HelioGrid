'use client';
import { IconCircle } from '@heliogrid/ui';
import { Trans } from '@lingui/react';
import { Check } from 'lucide-react';

export function DoneStep() {
  return (
    <div className="lg-step lg-done" role="status">
      <IconCircle icon={<Check size={30} strokeWidth={1.5} />} color="var(--success)" size={64} />
      <h1 className="lg-h1 lg-done-h1">
        <Trans id="You're signed in" />
      </h1>
      <p className="lg-body">
        <Trans id="Welcome back. Taking you to your day." />
      </p>
    </div>
  );
}
