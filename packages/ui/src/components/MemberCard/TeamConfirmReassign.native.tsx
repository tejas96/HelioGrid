/* Cross-component imports in a native half point at the NATIVE file — see NextAction.native.tsx. */
import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { useGround } from '../../primitives/Ground/Ground.native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Button } from '../Button/Button.native';
import { LoadingBars } from '../LoadingBars/LoadingBars.native';
import type { TeamConfirmReassignProps } from './MemberCard.types';

/**
 * A deactivation's open leads on the phone (`SCR-M01-12`): how many the person holds, and the row that
 * chooses who takes them all. The row names the chosen person once picked.
 */
export function TeamConfirmReassign({ read, to, onChoose, words }: TeamConfirmReassignProps) {
  const ground = useGround();
  if (read.kind === 'loading') return <LoadingBars bars={['control']} label={words.loading} />;
  if (read.kind === 'failed') {
    return (
      <View style={styles.reassign}>
        <Text variant="body-sm" color="secondary">
          {words.failed}
        </Text>
        <Button variant="secondary" size="sm" onClick={read.retry}>
          {words.retry}
        </Button>
      </View>
    );
  }
  if (read.kind === 'empty' || read.value === 0) {
    return (
      <Text variant="body-sm" color="secondary">
        {words.none}
      </Text>
    );
  }
  return (
    <View style={styles.reassign}>
      <Text variant="body-sm" bold>
        {words.holds(read.value)}
      </Text>
      <Pressable onPress={onChoose} style={[styles.row, { backgroundColor: ground.controlFill }]}>
        <View style={styles.words}>
          <Text variant="caption" color="secondary">
            {words.moveTo}
          </Text>
          <Text variant="body" bold>
            {to ?? words.choose}
          </Text>
        </View>
        <ShellGlyph name="chevron-right" size="sm" tone="secondary" />
      </Pressable>
      {to === null ? (
        <Text variant="caption" color="secondary">
          {words.stay}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  reassign: { gap: theme.spacing['sp-2'] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-2'],
    paddingHorizontal: theme.spacing['sp-3'],
    borderRadius: theme.radius['r-md'],
    borderWidth: 1,
    borderColor: colors['line-soft'],
  },
  words: { flex: 1, minWidth: 0 },
});
