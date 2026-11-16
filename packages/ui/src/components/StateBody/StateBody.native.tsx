import { RetryButton } from '../Button/RetryButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { UnavailableNote } from '../UnavailableNote/UnavailableNote.native';
import { TEXT_BARS } from './StateBody.logic';
import type { StateBodyProps } from './StateBody.types';
import { StateMessage } from './StateMessage.native';

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
    return unavailableTitle === undefined ? null : (
      <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'empty') {
    return <StateMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
