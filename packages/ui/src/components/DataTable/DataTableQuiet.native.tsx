import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../primitives/Color/colors';

const styles = StyleSheet.create({
  /* The lines a quiet table's rows stand between: one under the labels, one under the last row;
     the rows part by their own hairline (design-system change 20, as OneOhm draws a table). */
  rules: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors['line-soft'],
  },
});

/**
 * **A quiet table's rows stand on the page between two lines**, with no card behind them. Any
 * other table's rows are handed back as they are, so its layout is unchanged.
 */
export function QuietRules({ quiet, children }: { quiet: boolean; children: ReactNode }) {
  return quiet ? <View style={styles.rules}>{children}</View> : children;
}
