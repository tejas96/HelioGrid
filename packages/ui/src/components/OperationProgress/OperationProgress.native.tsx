import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { useFormat } from '../MarketProvider';
import { OperationActions } from './OperationActions.native';
import { OperationHead } from './OperationHead.native';
import { OperationMessage } from './OperationMessage.native';
import type { OperationProgressProps } from './OperationProgress.types';
import { OperationStages } from './OperationStages.native';
import { countWords, resolveCancel, resolvePercent, stepWords } from './operation-progress-model';

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
  style,
}: NativeOperationProgressProps) {
  const running = state === 'running';
  const pct = resolvePercent(state, value);
  const cancel = resolveCancel(onCancel, cancelEffect);
  const { number } = useFormat();
  const counted = countWords(count, unit, number);
  const step = stepWords(stageIndex, stageTotal);
  const showActions =
    cancel !== null || destination !== undefined || (state === 'failed' && onRetry !== undefined);

  return (
    <View style={[styles.shell, size === 'inline' ? styles.shellInline : null, style]}>
      <OperationHead
        label={label}
        pct={pct}
        running={running}
        gradient={gradient}
        step={step}
        stage={stage}
        counted={counted}
        size={size}
      />

      {stages !== undefined && stages.length > 0 ? <OperationStages stages={stages} /> : null}

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
          destination={destination}
        />
      ) : null}
    </View>
  );
}

const tertiary: TextStyle = { color: theme.colors['text-tertiary'] };

const styles = StyleSheet.create({
  shell: { flexDirection: 'column', gap: 10 },
  shellInline: { gap: theme.spacing['sp-2'] },
});
