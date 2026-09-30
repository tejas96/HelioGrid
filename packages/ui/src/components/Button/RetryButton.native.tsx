import { Button } from './Button.native';

/** Same contract, same rule as the web half: the act and the words, or nothing. */
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
