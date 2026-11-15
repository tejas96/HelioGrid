import { theme } from '@heliogrid/theme';
import { colors } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

/** The document screen's own layout on the phone; the pages, the pill and the dock are `packages/ui`'s. */
export const styles = StyleSheet.create({
  // The whole height in the page's own colour: the document stands alone, as search does.
  page: { flex: 1, backgroundColor: colors.canvas },
  // The large title under the icon bar, at the page's side pad (`CLAUDE.md` §10).
  head: { paddingHorizontal: theme.layout['screen-pad-mobile'] },
  // The reader takes what the bar leaves; its dock floats inside it, above the home indicator.
  reader: { flex: 1 },
});
