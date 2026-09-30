import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { RetryButton } from '../Button/RetryButton';
import type { OperationProgressProps } from './OperationProgress.types';
import type { CancelCopy } from './operation-progress-model';

interface OperationActionsProps
  extends Pick<
    OperationProgressProps,
    'onCancel' | 'cancelLabel' | 'cancelNote' | 'onRetry' | 'retryLabel' | 'destination' | 'state'
  > {
  running: boolean;
  cancel: CancelCopy | null;
}

/**
 * The action row: the cancel, the sentence that says what it stops, the retry a failure earns and
 * the destination the finished thing sits at.
 *
 * THE SENTENCE IS NOT OPTIONAL CHROME — it is the difference between a cancel and a lie, so it
 * renders whenever the cancel does and nothing removes it.
 */
export function OperationActions({
  running,
  cancel,
  onCancel,
  cancelLabel,
  cancelNote,
  state,
  onRetry,
  retryLabel,
  destination,
}: OperationActionsProps): ReactNode {
  return (
    <div className="hg-operation-progress-actions">
      {running && cancel !== null ? (
        <Button variant="secondary" size="md" onClick={onCancel}>
          {cancelLabel ?? cancel.label}
        </Button>
      ) : null}
      {running && cancel !== null ? (
        <span className="hg-operation-progress-cancel-note">{cancelNote ?? cancel.note}</span>
      ) : null}
      {state === 'failed' ? <RetryButton onRetry={onRetry} label={retryLabel} /> : null}
      {destination !== undefined ? (
        <span className="hg-operation-progress-destination">{destination}</span>
      ) : null}
    </div>
  );
}
