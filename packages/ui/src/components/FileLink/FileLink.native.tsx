import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import type { FileLinkProps } from './FileLink.types';

/** One file by its own name on the phone, a sheet glyph before it — the target opens it. */
export function FileLink({ name, onOpen }: FileLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      ripple="bounded"
      onPress={onOpen}
      style={styles.file}
    >
      <ShellGlyph name="file" size="sm" tone="accent" />
      <View style={styles.name}>
        <Text variant="body-sm" color="accent" bold>
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  file: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing['sp-1'],
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: theme.radius['r-xs'],
  },
  name: { flexShrink: 1, minWidth: 0 },
});
