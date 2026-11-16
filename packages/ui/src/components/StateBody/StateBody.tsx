import { RetryButton } from '../Button/RetryButton';
import { LoadingBars } from '../LoadingBars';
import { UnavailableNote } from '../UnavailableNote';
import { TEXT_BARS } from './StateBody.logic';
import type { StateBodyProps } from './StateBody.types';
import { StateMessage } from './StateMessage';

/** The one body a frame draws for its read's states (`StateBody.types.ts`). */
export function StateBody({
  children,
  state,
  loadingLabel,
  emptyTitle,
  emptyMessage,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
}: StateBodyProps) {
  if (state === 'loading') {
    return loadingLabel === undefined ? (
      <LoadingBars inBusyRegion bars={TEXT_BARS} />
    ) : (
      <LoadingBars label={loadingLabel} bars={TEXT_BARS} />
    );
  }
  if (state === 'error') {
    return (
      <StateMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
      />
    );
  }
  if (state === 'unavailable') {
    /* No retry, no warning tint — the absence is stated, not styled as a fault. Its words are the
       caller's, so an absence it does not name draws nothing. */
    return unavailableTitle === undefined ? null : (
      <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'empty') {
    /* Says so and stays. No icon, no bloom — the screen around it is full. */
    return <StateMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
