import { StyleSheet, View } from 'react-native';
import { Text } from '../../primitives/Text/Text.native';
import type { TextDividerProps } from './TextDivider.types';

export function TextDivider({ label }: TextDividerProps) {
  return (
    <View style={styles.divider}>
      <Text variant="caption" color="secondary" align="center">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { alignSelf: 'stretch' },
});
