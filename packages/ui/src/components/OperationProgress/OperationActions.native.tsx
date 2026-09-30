import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { Button } from '../Button/Button.native';
import { RetryButton } from '../Button/RetryButton.native';
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

/** A bare string/number takes the row's own type treatment; a node is the caller's drawing. */
function renderNote(node: ReactNode) {
  if (typeof node === 'string' || typeof node === 'number') {
    return (
      <Text variant="caption" color="tertiary">
        {node}
      </Text>
    );
  }
  return node;
}

/**
 * The action row. THE CANCEL SENTENCE IS NOT OPTIONAL CHROME — it is the difference between a
 * cancel and a lie, so it renders whenever the cancel does and nothing removes it.
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
}: OperationActionsProps) {
  return (
    <View style={styles.actions}>
      {running && cancel !== null ? (
        <Button variant="secondary" size="md" onClick={onCancel}>
          {cancelLabel ?? cancel.label}
        </Button>
      ) : null}
      {running && cancel !== null ? (
        <View style={styles.cancelNote}>{renderNote(cancelNote ?? cancel.note)}</View>
      ) : null}
      {state === 'failed' ? <RetryButton onRetry={onRetry} label={retryLabel} /> : null}
      {destination !== undefined ? <View style={styles.destination}>{destination}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  cancelNote: { flexShrink: 1, flexGrow: 1, minWidth: 140 },
  destination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    minHeight: 44,
  },
});
