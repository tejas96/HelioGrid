'use client';
import type { OtpFailure } from '@heliogrid/domain';
import { Trans } from '@lingui/react';
import { CircleAlert } from 'lucide-react';

interface OtpErrorRowProps {
  failure: OtpFailure | null;
}

export function OtpErrorRow({ failure }: OtpErrorRowProps) {
  if (failure === null) return null;
  return (
    <p className="lg-error" role="alert">
      <CircleAlert size={16} strokeWidth={1.5} aria-hidden />
      {failure === 'mismatch' ? (
        <Trans id="That code doesn’t match. Check it and try again." />
      ) : failure === 'verify-failed' ? (
        <Trans id="Couldn't check the code. Try again." />
      ) : (
        <Trans id="Couldn't send the code. Try again." />
      )}
    </p>
  );
}
