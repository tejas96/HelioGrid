import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import type { LeadSelectionBarProps } from './LeadTile.types';

/**
 * The bar a selection raises on the phone (`M02-29`): how many are ticked, *Assign* — one target
 * for them all, through the picker — and the way to clear. The count is said as it changes.
 */
export function LeadSelectionBar({ count, onAssign, onClear, words }: LeadSelectionBarProps) {
  return (
    <View style={styles.bar}>
      <Text variant="body-sm" bold live style={styles.count}>
        {words.selected(count)}
      </Text>
      <Button
        variant="primary"
        size="sm"
        icon={<ShellGlyph name="user-plus" size="sm" tone="inverse" />}
        onClick={onAssign}
      >
        {words.assign}
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear}>
        {words.clear}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingVertical: theme.spacing['sp-1'],
    paddingStart: theme.spacing['sp-4'],
    paddingEnd: theme.spacing['sp-1'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: colors['accent-subtle'],
  },
  count: { flexGrow: 1 },
});
