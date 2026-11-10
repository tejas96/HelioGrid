import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { PendingAction } from '../PendingAction/PendingAction.native';
import type { MergeActProps } from './MergeCompare.types';

/** The merge's act, with what it waits on or why it came back said under it. */
export function MergeAct({
  label,
  onMerge,
  awake,
  merging,
  waiting,
  failure,
  line,
  warning,
}: MergeActProps) {
  return (
    <View style={styles.act}>
      {warning === null ? null : (
        <View style={styles.warning}>
          <ShellGlyph name="alert-triangle" size="md" tone="warning" />
          <View style={styles.words}>
            <Text variant="body-sm" color="warning" bold>
              {warning}
            </Text>
          </View>
        </View>
      )}
      <Button
        variant="primary"
        size="prominent"
        fullWidth
        icon={<ShellGlyph name="tick" size="md" tone="inverse" />}
        disabled={!awake}
        loading={merging}
        onClick={onMerge}
      >
        {label}
      </Button>
      {merging ? (
        <PendingAction state="waiting" label={waiting} />
      ) : failure !== null ? (
        <PendingAction state="returned" reason={failure} />
      ) : line === null ? null : (
        <Text variant="body-sm" color="secondary">
          {line}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  act: { gap: theme.spacing['sp-2'] },
  warning: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  words: { flex: 1, minWidth: 0 },
});
