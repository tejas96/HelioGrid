import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider';
import { OperationActions } from './OperationActions.native';
import { OperationHead } from './OperationHead.native';
import { OperationMessage } from './OperationMessage.native';
import type { OperationProgressProps } from './OperationProgress.types';
import { OperationRing } from './OperationRing.native';
import { OperationStages } from './OperationStages.native';
import {
  countWords,
  offersOperationActs,
  resolveCancel,
  resolvePercent,
  stepWords,
} from './operation-progress-model';

interface NativeOperationProgressProps extends OperationProgressProps {
  style?: StyleProp<ViewStyle>;
}

/** A bare string/number label takes the component's own type treatment; a node is the caller's. */
function renderNode(node: ReactNode, style: TextStyle, variant: 'body' | 'body-sm' | 'caption') {
  if (typeof node === 'string' || typeof node === 'number') {
    return (
      <Text variant={variant} style={style}>
        {node}
      </Text>
    );
  }
  return node;
}

/**
 * WORK THAT TAKES TIME, WITH ITS NAME, ITS SHAPE AND AN HONEST CANCEL — a computation you are
 * WATCHING, in place, in the surface that started it.
 *
 * INDETERMINATE IS A REAL STATE: no percentage is printed, and the rail carries no
 * `accessibilityValue`, because a bar with an invented number on it is a claim.
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
  style,
}: NativeOperationProgressProps) {
  /* The frame stays while a retry reloads the work, so the reader lands on it once Try again leaves. */
  const frame = useRef<View>(null);
  const running = state === 'running';
  const pct = resolvePercent(state, value);
  const cancel = resolveCancel(onCancel, cancelEffect, words);
  const { number } = useFormat();
  const counted = countWords(count, unit, number, words);
  const step = stepWords(stageIndex, stageTotal, words);
  const showActions = offersOperationActs({ cancel, destination, state, onRetry, retryLabel });

  if (size === 'ring') {
    return <OperationRing label={label} count={count} countCaption={countCaption} style={style} />;
  }

  return (
    <View ref={frame} style={[styles.shell, style]}>
      <OperationHead
        label={label}
        inProgress={words.inProgress(label)}
        pct={pct}
        running={running}
        gradient={gradient}
        step={step}
        stage={stage}
        counted={counted}
        size={size}
      />

      {stages !== undefined && stages.length > 0 ? (
        <OperationStages stages={stages} words={words} />
      ) : null}

      {/* M02-21's promise, said where the person is: you may leave. */}
      {running && leaveNote !== undefined ? renderNode(leaveNote, tertiary, 'caption') : null}

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
    </View>
  );
}

const tertiary: TextStyle = { color: theme.colors['text-tertiary'] };

const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: theme.spacing['sp-2'] },
});
