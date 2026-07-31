import { RESEND_SECONDS } from '@heliogrid/domain';
import { useCallback, useEffect, useState } from 'react';

/**
 * 30s resend countdown. Ticks only while `active` — mirrors the pre-split effect's
 * `if (step !== 'otp') return;` gate, and its cleanup, which covers both unmount and
 * leaving the OTP step (e.g. "Change number"), so the interval can never keep firing on
 * the phone step. `restart()` (bump `epoch`) rewinds it on every resend, matching web's
 * `useResendCountdown(active, epoch)`. Timestamp math, not tick decrement — RN suspends
 * timers while backgrounded.
 */
export function useResendCountdown(active: boolean): { secondsLeft: number; restart: () => void } {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [epoch, setEpoch] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: epoch is the deliberate restart trigger — every resend rewinds the countdown
  useEffect(() => {
    if (!active) return;
    setSecondsLeft(RESEND_SECONDS);
    const end = Date.now() + RESEND_SECONDS * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [active, epoch]);

  const restart = useCallback(() => setEpoch((k) => k + 1), []);
  return { secondsLeft, restart };
}
