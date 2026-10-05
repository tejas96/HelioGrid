import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { AccountTileProps } from './AccountTile.types';

/** React Native breaks a word too long for the line at a character, so the account needs no rule. */
export function AccountTile({ overline, account }: AccountTileProps) {
  return (
    <View style={styles.tile}>
      <Text variant="overline" color="secondary">
        {overline}
      </Text>
      <Text variant="body-sm" bold>
        {account}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignSelf: 'stretch',
    gap: theme.spacing['sp-1'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
    backgroundColor: theme.colors['neutral-bg'],
  },
});
