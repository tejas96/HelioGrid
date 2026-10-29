import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import { OperationActions } from './OperationActions';
import { OperationHead } from './OperationHead';
import { OperationMessage } from './OperationMessage';
import type { OperationProgressProps } from './OperationProgress.types';
import { OperationRing } from './OperationRing';
import { OperationStages } from './OperationStages';
import {
  countWords,
  offersOperationActs,
  resolveCancel,
  resolvePercent,
  stepWords,
} from './operation-progress-model';

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
  words,
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
  retryLabel,
  destination,
  gradient = false,
  size = 'block',
  countCaption,
  className,
  style,
}: WebOperationProgressProps) {
  /* The frame stays while a retry reloads the work, so focus lands on it once Try again leaves. */
  const frame = useRef<HTMLDivElement>(null);
  const running = state === 'running';
  const pct = resolvePercent(state, value);
  const cancel = resolveCancel(onCancel, cancelEffect, words);
  const { number } = useFormat();
  const counted = countWords(count, unit, number, words);
  const step = stepWords(stageIndex, stageTotal, words);
  const showActions = offersOperationActs({ cancel, destination, state, onRetry, retryLabel });

  if (size === 'ring') {
    return (
      <OperationRing
        label={label}
        count={count}
        countCaption={countCaption}
        className={className}
        style={style}
      />
    );
  }

  return (
    <div
      ref={frame}
      tabIndex={-1}
      data-size={size}
      className={classNames('hg-operation-progress', 'hg-focus-target', className)}
      style={style}
    >
      <OperationHead
        label={label}
        pct={pct}
        running={running}
        gradient={gradient}
        step={step}
        stage={stage}
        counted={counted}
      />

      {stages !== undefined && stages.length > 0 ? (
        <OperationStages stages={stages} stateWords={words.stageState} />
      ) : null}

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
          frame={frame}
          destination={destination}
        />
      ) : null}
    </div>
  );
}
