import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  /* The card a quiet table's rows stand in, raised over the page (design-system change 20). */
  card: {
    // biome-ignore lint/plugin/raw-white: the card the quiet rows stand in, raised over the page
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-md'],
    ...theme.elevation.e2,
  },
});

/**
 * **A quiet table's rows stand in one raised card under the labels** (`SCR-M01-12`). Any other
 * table's rows are handed back as they are, so its layout is unchanged.
 */
export function QuietCard({ quiet, children }: { quiet: boolean; children: ReactNode }) {
  return quiet ? <View style={styles.card}>{children}</View> : children;
}
