import { theme } from '@heliogrid/theme';
import { StyleSheet, View } from 'react-native';
import { GroundProvider, tileSurface } from '../../primitives/Ground/Ground.native';
import { Text } from '../../primitives/Text/Text.native';
import type { AccountTileProps } from './AccountTile.types';

/** React Native breaks a word too long for the line at a character, so the account needs no rule. */
export function AccountTile({ overline, account }: AccountTileProps) {
  return (
    <View style={[tileSurface, styles.tile]}>
      <GroundProvider ground="tile">
        <Text variant="overline" color="secondary">
          {overline}
        </Text>
        <Text variant="body-sm" bold>
          {account}
        </Text>
      </GroundProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignSelf: 'stretch',
    gap: theme.spacing['sp-1'],
    padding: theme.layout['tile-pad'],
    borderRadius: theme.radius['r-tile'],
  },
});
