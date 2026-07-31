'use client';
import { RESEND_SECONDS } from '@heliogrid/domain';
import { useEffect, useState } from 'react';

/** Self-contained resend countdown: restarts whenever `active` flips true or `epoch`
 *  bumps — every resend rewinds the countdown (docs/modules/auth-tenancy/specs/login.md §5). */
export function useResendCountdown(active: boolean, epoch: number) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the deliberate restart trigger — every resend rewinds the countdown
  useEffect(() => {
    if (!active) return;
    setSecondsLeft(RESEND_SECONDS);
    const interval = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [active, epoch]);

  return secondsLeft;
}
