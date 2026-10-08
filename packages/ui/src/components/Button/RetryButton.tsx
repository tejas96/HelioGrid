import { Button } from './Button';

/**
 * The one Try again every component's error state draws — `Button` secondary, white at `--e2` on
 * every ground (`F7-15`), so a change to the secondary reaches every retry at once.
 *
 * It renders only with BOTH the act and the words — blank words are no words, since a button with
 * none has no accessible name: the words are the caller's, from
 * `packages/i18n`, and an English fallback here would reach a Hindi or Marathi reader.
 */
export function RetryButton({ onRetry, label }: { onRetry?: () => void; label?: string }) {
  if (onRetry === undefined || label === undefined || label.trim() === '') {
    return null;
  }
  return (
    <Button variant="secondary" size="md" onClick={onRetry}>
      {label}
    </Button>
  );
}
