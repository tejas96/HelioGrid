import { theme } from '@heliogrid/theme';
import { colors } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  /* The whole height, the page's own colour: the search is a sheet over the screen it was opened on. */
  page: { flex: 1, backgroundColor: colors.canvas },
  /* The field and Cancel, held at the top while the results scroll under them. */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-2'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingTop: theme.spacing['sp-2'],
    paddingBottom: theme.spacing['sp-3'],
  },
  field: { flex: 1, minWidth: 0 },
  results: {
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingTop: theme.spacing['sp-2'],
  },
});
