import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { Button } from '../Button/Button';
import { RetryButton } from '../Button/RetryButton';
import type { CancelWords, OperationProgressProps } from './OperationProgress.types';
import { offeredCancel } from './operation-progress-model';

interface OperationActionsProps
  extends Pick<
    OperationProgressProps,
    'onCancel' | 'cancelLabel' | 'cancelNote' | 'onRetry' | 'retryLabel' | 'destination' | 'state'
  > {
  running: boolean;
  cancel: CancelWords | null;
  /** The progress's own frame, where focus lands once Try again has left. */
  frame: FocusAfter;
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
  frame,
  destination,
}: OperationActionsProps): ReactNode {
  const offered = offeredCancel(running, cancel, cancelLabel, cancelNote);
  return (
    <div className="hg-operation-progress-actions">
      {offered === null ? null : (
        <Button variant="secondary" size="md" onClick={onCancel}>
          {offered.label}
        </Button>
      )}
      {offered === null ? null : (
        <span className="hg-operation-progress-cancel-note">{offered.note}</span>
      )}
      {state === 'failed' ? (
        <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={frame} />
      ) : null}
      {destination !== undefined ? (
        <span className="hg-operation-progress-destination">{destination}</span>
      ) : null}
    </div>
  );
}
