import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoConnectionProps, NoConnectionStatus } from './NoConnection.types';

const TIMED_OUT = Symbol('timeout');

export interface RetryFailure {
  kind: 'failed' | 'timeout';
  /** Clock time of the last attempt; null when the host owns the lifecycle. */
  at: string | null;
}

export interface RetryLifecycle {
  trying: boolean;
  failure: RetryFailure | null;
  handleRetry: () => void;
}

function clockTime(date: Date): string {
  const hours = date.getHours();
  const suffix = hours < 12 ? 'AM' : 'PM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`;
}

/**
 * RETRY CANNOT LIE. It reports what actually happened: a retry that fails says so plainly and the
 * button comes back, and a retry that never answers is stopped at `retryTimeout` rather than
 * spinning forever under a user who thinks it is still working. Anything other than an explicit
 * failure or a non-answer is treated as handled — the host unmounts this screen when the app is
 * back, so the component never claims a success it did not observe.
 *
 * Platform-neutral: React state and timers only, so both halves share one lifecycle.
 */
export function useRetryLifecycle(
  onRetry: NoConnectionProps['onRetry'],
  retryTimeout: number,
  status: NoConnectionStatus | undefined,
): RetryLifecycle {
  const [ownStatus, setOwnStatus] = useState<NoConnectionStatus>('idle');
  const [outcome, setOutcome] = useState<RetryFailure | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const phase: NoConnectionStatus = status ?? ownStatus;
  const trying = phase === 'trying';

  const handleRetry = useCallback(() => {
    if (trying) {
      return;
    }
    if (status !== undefined) {
      onRetry?.();
      return;
    }
    setOwnStatus('trying');
    setOutcome(null);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = Promise.resolve(onRetry === undefined ? false : onRetry());
    const deadline = new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), retryTimeout);
    });

    Promise.race([attempt, deadline])
      .catch(() => false)
      .then((result) => {
        clearTimeout(timer);
        if (!alive.current) {
          return;
        }
        if (result === false || result === TIMED_OUT) {
          setOutcome({
            kind: result === TIMED_OUT ? 'timeout' : 'failed',
            at: clockTime(new Date()),
          });
          setOwnStatus('failed');
        } else {
          setOwnStatus('idle');
        }
      })
      .catch(() => undefined);
  }, [trying, status, onRetry, retryTimeout]);

  const failure: RetryFailure | null =
    status === 'failed' ? { kind: 'failed', at: null } : phase === 'failed' ? outcome : null;

  return { trying, failure, handleRetry };
}

/** The one place the screen is allowed to be specific: what actually happened last time. */
export function failureSentence(
  failure: RetryFailure | null,
  failedMessage: string,
  timeoutMessage: string,
): string | null {
  if (failure === null) {
    return null;
  }
  const head = failure.kind === 'timeout' ? timeoutMessage : failedMessage;
  return failure.at === null ? head : `${head} Last tried at ${failure.at}.`;
}
