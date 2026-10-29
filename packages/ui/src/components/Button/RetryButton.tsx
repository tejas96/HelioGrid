import { useFocusAfter } from '../../primitives/FocusAfter';
import { Button } from './Button';
import { retryOf } from './Button.logic';
import type { RetryButtonProps } from './Button.types';

/**
 * The one Try again every component's error state draws — `Button` secondary, white at `--e2` on
 * every ground (`F7-15`), so a change to the secondary reaches every retry at once.
 *
 * It renders only with BOTH the act and the words — blank words are no words, since a button with
 * none has no accessible name. Once pressed it leaves with the failed state, so focus moves to
 * `focusAfter`.
 */
export function RetryButton({ onRetry, label, focusAfter, size = 'md' }: RetryButtonProps) {
  const leaving = useFocusAfter(focusAfter);
  const act = retryOf(onRetry, label);
  if (act === null) {
    return null;
  }
  return (
    <Button variant="secondary" size={size} onClick={leaving(act.retry)}>
      {act.label}
    </Button>
  );
}
