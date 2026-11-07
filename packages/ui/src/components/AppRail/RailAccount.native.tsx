import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';
import { Text } from '../../primitives/Text/Text.native';
import type { RailAccount as RailAccountProps } from './AppRail.types';

/**
 * The sidebar's foot: the person signed in — their avatar menu, name, role and company — and the
 * theme switch under them. Folded, the avatar alone.
 */
export function RailAccount({ account, folded }: { account: RailAccountProps; folded: boolean }) {
  if (folded) return <View style={styles.avatar}>{account.menu}</View>;
  return (
    <View style={styles.account}>
      <View style={styles.who}>
        {account.menu}
        <View style={styles.words}>
          <Text variant="body-sm" bold oneLine>
            {account.name}
          </Text>
          {account.caption === undefined ? null : (
            <Text variant="caption" color="secondary" oneLine>
              {account.caption}
            </Text>
          )}
        </View>
      </View>
      {account.appearance}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
  },
  account: {
    gap: theme.spacing['sp-2'],
    padding: theme.spacing['sp-2'],
    borderRadius: theme.radius['r-tile'],
    // biome-ignore lint/plugin/raw-white: the account block is a card on the sidebar
    backgroundColor: colors.surface,
    ...theme.elevation.e1,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
  },
  words: {
    flex: 1,
    minWidth: 0,
  },
});
