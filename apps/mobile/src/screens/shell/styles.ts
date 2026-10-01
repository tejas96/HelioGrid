import { theme } from '@heliogrid/theme';
import { PILL_NAV_HEIGHT } from '@heliogrid/ui';
import { StyleSheet } from 'react-native';

/** The pill floats this far above the device's home-indicator inset (`F7-50`). */
export const PILL_GAP = theme.spacing['sp-6'];

/** How far a screen under the pill must scroll past its last row so the pill never covers it. */
export const underPill = (insetBottom: number) => PILL_NAV_HEIGHT + PILL_GAP + insetBottom;

/**
 * The switcher spans the page's column: a home title and its preset share one row, and the menu's
 * own default width wrapped "My Visits Today" onto three lines.
 */
export const switcherWidth = (windowWidth: number) =>
  windowWidth - 2 * theme.layout['screen-pad-mobile'];

export const styles = StyleSheet.create({
  // The page is `surface` (`F7-49`); the status band and the bar paint it too, so nothing that
  // scrolls shows under the camera or the status bar (`F7-50`).
  page: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scroll: {
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingTop: theme.spacing['sp-4'],
    gap: theme.spacing['sp-6'],
  },
  pill: {
    position: 'absolute',
    left: theme.layout['screen-pad-mobile'],
    right: theme.layout['screen-pad-mobile'],
  },
  head: {
    gap: theme.spacing['sp-1'],
  },
  // What the switcher's mark points at: the title alone, not the row it sits in.
  titleAnchor: {
    alignSelf: 'flex-start',
  },
  titleTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing['sp-1'],
    minHeight: theme.spacing['sp-12'],
  },
  blockHeading: {
    gap: theme.spacing['sp-6'],
  },
  centre: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    gap: theme.spacing['sp-4'],
  },
});
