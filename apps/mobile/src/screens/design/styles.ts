import { theme } from '@heliogrid/theme';
import { colors } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

/** The design page's own layout on the phone; every part is `packages/ui`'s. */
export const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-6'] },
  /** The studio fills the whole screen, under the phone's bars, on the page's own ground. */
  studio: { flex: 1, backgroundColor: colors.canvas },
});
