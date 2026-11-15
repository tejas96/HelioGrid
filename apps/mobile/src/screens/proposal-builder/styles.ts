import { theme } from '@heliogrid/theme';
import { colors } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

/** The builder's own layout on the phone; the frame, the steps and the sheets are `packages/ui`'s. */
export const styles = StyleSheet.create({
  // The whole height in the page's own colour: a focus screen stands alone — no shell, no pill.
  page: { flex: 1, backgroundColor: colors.canvas },
  // The device's top inset is added where it is read.
  loading: { flex: 1, paddingHorizontal: theme.spacing['sp-5'] },
});
