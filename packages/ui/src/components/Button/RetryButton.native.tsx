import { useFocusAfter } from '../../primitives/FocusAfter';
import { retryOf } from './Button.logic';
import { Button } from './Button.native';
import type { RetryButtonProps } from './Button.types';

/** Same contract, same rule as the web half: the act and the words, or nothing. */
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
