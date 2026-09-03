import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import { OperationActions } from './OperationActions';
import { OperationHead } from './OperationHead';
import { OperationMessage } from './OperationMessage';
import type { OperationProgressProps } from './OperationProgress.types';
import { OperationStages } from './OperationStages';
import { countWords, resolveCancel, resolvePercent, stepWords } from './operation-progress-model';

interface WebOperationProgressProps extends OperationProgressProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * WORK THAT TAKES TIME, WITH ITS NAME, ITS SHAPE AND AN HONEST CANCEL — a computation you are
 * WATCHING, in place, in the surface that started it. The one you LEFT is `JobTray`.
 *
 * STAGE NARRATION IS NOT DECORATION: a percentage says how far, only words say what.
 * INDETERMINATE IS A REAL STATE: no percentage is printed and `role="progressbar"` carries no
 * `aria-valuenow`, because a bar with an invented number on it is a claim.
 */
export function OperationProgress({
  label,
  value = null,
  count = null,
  unit,
  stage,
  stageIndex,
  stageTotal,
  stages,
  state = 'running',
  message,
  leaveNote,
  onCancel,
  cancelEffect,
  cancelLabel,
  cancelNote,
  onRetry,
  retryLabel = 'Try again',
  destination,
  gradient = false,
  size = 'block',
  className,
  style,
}: WebOperationProgressProps) {
  const running = state === 'running';
  const pct = resolvePercent(state, value);
  const cancel = resolveCancel(onCancel, cancelEffect);
  const { number } = useFormat();
  const counted = countWords(count, unit, number);
  const step = stepWords(stageIndex, stageTotal);
  const showActions =
    cancel !== null || destination !== undefined || (state === 'failed' && onRetry !== undefined);

  return (
    <div data-size={size} className={classNames('hg-operation-progress', className)} style={style}>
      <OperationHead
        label={label}
        pct={pct}
        running={running}
        gradient={gradient}
        step={step}
        stage={stage}
        counted={counted}
      />

      {stages !== undefined && stages.length > 0 ? <OperationStages stages={stages} /> : null}

      {/* M02-21's promise, said where the person is: you may leave. */}
      {running && leaveNote !== undefined ? (
        <p className="hg-operation-progress-leave">{leaveNote}</p>
      ) : null}

      {!running && message !== undefined ? (
        <OperationMessage state={state} message={message} />
      ) : null}

      {showActions ? (
        <OperationActions
          running={running}
          cancel={cancel}
          onCancel={onCancel}
          cancelLabel={cancelLabel}
          cancelNote={cancelNote}
          state={state}
          onRetry={onRetry}
          retryLabel={retryLabel}
          destination={destination}
        />
      ) : null}
    </div>
  );
}
