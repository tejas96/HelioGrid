import { ShellGlyph } from '../AppShell/ShellGlyph';
import { RetryButton } from '../Button/RetryButton';
import { EmptyState } from './EmptyState';
import type { FailedReadProps } from './EmptyState.types';

/** A read that failed, on the web: the warning, what happened and *Try again*. */
export function FailedRead({ title, message, retryLabel, onRetry, focusAfter }: FailedReadProps) {
  return (
    <EmptyState
      icon={<ShellGlyph name="alert-triangle" size="lg" tone="warning" />}
      title={title}
      description={message}
      action={
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} size="lg" />
      }
    />
  );
}
