import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/** Customer Merge's own layout on the phone; the compare, the moves and the done are `packages/ui`'s. */
export const styles = StyleSheet.create({
  page: { gap: theme.spacing['sp-5'] },
  /* The act bar under the steps: the page's gutter at its sides; the home indicator's band is
     added under it where it is drawn (`MergeFoot`). */
  foot: {
    paddingTop: theme.spacing['sp-3'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  stack: { gap: theme.spacing['sp-3'] },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.spacing['sp-2'] },
  start: { alignItems: 'flex-start' },
  who: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-3'] },
  whoWords: { flex: 1, minWidth: 0, gap: theme.spacing['sp-0-5'] },
  kept: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  keptValue: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
});
