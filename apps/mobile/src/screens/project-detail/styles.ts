import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/** The project page's own layout on the phone; the project itself is `packages/ui`'s. */
export const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-4'] },
  /* The facts' pills and the call and ⋯ beside them, under the large title. */
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
});
