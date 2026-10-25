import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/* The full-size reader (`SCR-M01-19` m19-h) holds the sheet at its column width and never scrolls
   sideways past it; the act bar's failure banner (m19-n4) sits on the page's ground over the bar. */
export const styles = StyleSheet.create({
  fullSize: {
    flex: 1,
    overflow: 'hidden',
  },
  failure: {
    paddingVertical: theme.spacing['sp-3'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    backgroundColor: theme.colors.canvas,
  },
});
