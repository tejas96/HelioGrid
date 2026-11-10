import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '../../primitives/Pressable/Pressable.native';
import { Text } from '../../primitives/Text/Text.native';
import { ShellGlyph } from '../AppShell/ShellGlyph.native';
import { Avatar } from '../Avatar/Avatar.native';
import type { AccountRowProps } from './AccountMenu.types';

/** What `Menu` hands its trigger: the press that opens it. */
interface MenuHanded {
  disabled?: boolean;
  onClick?: () => void;
}

/** The account as one row that opens its menu: avatar, name, the quiet line and an up-down mark. */
export function AccountRow({
  name,
  caption,
  label,
  disabled,
  onClick,
}: AccountRowProps & MenuHanded) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onClick}
      style={styles.row}
    >
      <Avatar name={name} size={theme.spacing['sp-8']} />
      <View style={styles.words}>
        <Text variant="body-sm" bold oneLine>
          {name}
        </Text>
        {caption === undefined ? null : (
          <Text variant="caption" color="tertiary" oneLine>
            {caption}
          </Text>
        )}
      </View>
      <ShellGlyph name="chevrons-up-down" size="sm" tone="secondary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-sm'],
  },
  words: {
    flex: 1,
    minWidth: 0,
  },
});
