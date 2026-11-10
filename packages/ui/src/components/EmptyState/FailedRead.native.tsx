import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { RetryButton } from '../Button/RetryButton.native';
import { EmptyState } from './EmptyState.native';
import type { FailedReadProps } from './EmptyState.types';

/** A read that failed, on the phone: the warning, what happened and *Try again*. */
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
