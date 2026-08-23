import { UnavailableNote } from '../UnavailableNote';
import type { ChecklistProps } from './Checklist.types';

type StateProps = Required<Pick<ChecklistProps, 'state'>> &
  Pick<
    ChecklistProps,
    | 'emptyTitle'
    | 'emptyMessage'
    | 'errorTitle'
    | 'errorMessage'
    | 'onRetry'
    | 'unavailableTitle'
    | 'unavailableMessage'
  >;

/**
 * The four non-ready states.
 *
 * `error` went wrong and offers a retry; `unavailable` was **never going to be here** — neutral
 * words, no warning tint, and **no retry, ever**, because trying again cannot change the answer.
 */
export function ChecklistStateBody({
  state,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: StateProps) {
  if (state === 'loading') {
    return <div className="hg-checklist-skeleton" role="status" aria-label="Loading checklist" />;
  }

  if (state === 'unavailable') {
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
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
      {onRetry === undefined ? null : (
        <button type="button" className="hg-checklist-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
