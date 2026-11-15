import { RetryButton } from '../Button/RetryButton.native';
import { EmptyState } from './EmptyState.native';
import type { FailedReadProps } from './EmptyState.types';

/** A read that failed, on the phone: the `failed` scene, what happened and *Try again*. */
export function FailedRead({ title, message, retryLabel, onRetry, focusAfter }: FailedReadProps) {
  return (
    <EmptyState
      scene="failed"
      title={title}
      description={message}
      action={
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} size="lg" />
      }
    />
  );
}
