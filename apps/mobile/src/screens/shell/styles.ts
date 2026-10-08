import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * How far a screen under the pill must scroll past its last row so the pill never covers it:
 * `--bottomnav-h` is the pill and its gap, above the device's home-indicator inset (`F7-50`).
 */
export const underPill = (insetBottom: number) => theme.layout['bottomnav-h'] + insetBottom;

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
    // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
    backgroundColor: theme.colors.surface,
  },
  // Grows to the page, so Frame 8 centres in it (`D77`); the home's rows still start at the top.
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingTop: theme.spacing['sp-4'],
    gap: theme.spacing['sp-6'],
  },
  // Frame 10 has no bar and no pill: its block is centred in the whole page, and scrolls when
  // the largest text makes it taller than the screen.
  updateScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.layout['screen-pad-mobile'],
    paddingVertical: theme.spacing['sp-6'],
  },
  // The frame the pill floats in: the screen down to the device's bottom inset, which the
  // screen reads; touches pass through it to the page.
  pillFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
