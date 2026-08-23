import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';
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
        <Pressable className="hg-operation-progress-pill" onPress={onCancel}>
          {cancelLabel ?? cancel.label}
        </Pressable>
      ) : null}
      {running && cancel !== null ? (
        <span className="hg-operation-progress-cancel-note">{cancelNote ?? cancel.note}</span>
      ) : null}
      {state === 'failed' && onRetry !== undefined ? (
        <Pressable className="hg-operation-progress-pill" onPress={onRetry}>
          {retryLabel}
        </Pressable>
      ) : null}
      {destination !== undefined ? (
        <span className="hg-operation-progress-destination">{destination}</span>
      ) : null}
    </div>
  );
}
