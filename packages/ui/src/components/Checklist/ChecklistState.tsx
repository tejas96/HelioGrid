import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import type { ChecklistStateProps } from './Checklist.types';

/**
 * The four non-ready states.
 *
 * `error` went wrong and offers a retry; `unavailable` was **never going to be here** — neutral
 * words, no warning tint, and **no retry, ever**, because trying again cannot change the answer.
 */
export function ChecklistStateBody({
  state,
  loadingLabel,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
}: ChecklistStateProps) {
  if (state === 'loading') {
    return <div className="hg-checklist-skeleton" role="status" aria-label={loadingLabel} />;
  }

  if (state === 'unavailable') {
    return unavailableTitle === undefined ? null : (
      <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
    );
  }

  if (state === 'empty') {
    return (
      <div className="hg-checklist-note">
        <p className="hg-checklist-state-title">{emptyTitle}</p>
        <p className="hg-checklist-detail">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="hg-checklist-note">
      <p className="hg-checklist-state-title">{errorTitle}</p>
      <p className="hg-checklist-detail hg-checklist-detail--warning">{errorMessage}</p>
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
    </div>
  );
}
