import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet } from 'react-native';

/**
 * Shared layout for the gallery screen itself (apps/mobile/CLAUDE.md §Local conventions —
 * screen-folder satellites). Section-local styles (the back-glyph border trick, the bloom/
 * dark wells, the stat-card flex-one) stay colocated with the files that use them instead
 * of living here — component-local geometry stays with its component; this file owns only
 * screen-level layout.
 */
export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing['sp-3'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingBottom: theme.spacing['sp-3'],
  },
  content: {
    padding: theme.layout['screen-pad-mobile'],
    gap: theme.spacing['sp-8'],
  },
});
