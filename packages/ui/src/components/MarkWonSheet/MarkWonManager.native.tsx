import { theme } from '@heliogrid/theme';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { RetryButton } from '../Button/RetryButton.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import { Select } from '../Select/Select.native';
import { managerSelectOf } from './MarkWonSheet.logic';
import type { MarkWonManagerFieldProps } from './MarkWonSheet.types';

/**
 * Who manages the project, on the phone: the only one picked and said so, else a choice with the
 * chosen one's live projects under it; its wait in place, and its failure with *Try again*, which
 * hands the screen reader to the field's own frame while it loads again.
 */
export function MarkWonManagerField(props: MarkWonManagerFieldProps) {
  const { words, managers } = props;
  const frame = useRef<View>(null);
  return (
    <View ref={frame} style={styles.field}>
      {managers.kind === 'loading' || managers.kind === 'failed' ? (
        <Text variant="field-label">{words.manager}</Text>
      ) : null}
      {managers.kind === 'loading' ? (
        <LoadingBars bars={['control']} label={words.managersLoading} />
      ) : managers.kind === 'failed' ? (
        <View style={styles.failed}>
          <Text variant="body-sm" color="danger">
            {words.managersFailed}
          </Text>
          <RetryButton onRetry={managers.retry} label={words.retry} focusAfter={frame} size="sm" />
        </View>
      ) : (
        <Select {...managerSelectOf(props)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: theme.spacing['sp-2'] },
  failed: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
});
