import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * The door's column at 375, as `SCR-M01-01` and `SCR-M01-02` draw it inside the frame
 * `@heliogrid/ui` owns (`DoorFrame`; the number and code steps are `DoorNumberStep` and
 * `DoorCodeStep`): the inset behind the frame, the link step's column and tile, and the switch
 * sheet's body. Shared by the sign-in door and company signup.
 */
export const styles = StyleSheet.create({
  /** The inset behind the frame: the page, so the status-bar and home-indicator bands match the frame's ground. */
  // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
  inset: { flex: 1, backgroundColor: theme.colors.surface },
  /** Takes the free height under an off-flow frame's task; never under `sp-6`. */
  spacer: { flex: 1, minHeight: theme.spacing['sp-6'] },
  /** The link step's column, centred in the space under the header (`SCR-M01-01`); at least `sp-6` above and below. */
  codeColumn: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: theme.spacing['sp-5'],
    paddingVertical: theme.spacing['sp-6'],
  },
  codeTitle: { gap: theme.spacing['sp-1'] },
  /** A door title and its Explainer on one row, `sp-2` apart. */
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The title gives way and wraps, so a long one never pushes its Explainer off the screen. */
  titleText: { flexShrink: 1 },
  /** The tile, then `sp-2`, then "Not you?" at the start of the line. */
  linkAccount: { gap: theme.spacing['sp-2'], alignItems: 'flex-start' },
  centred: { alignItems: 'center' },
  sheetBody: { gap: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-2'] },
  sheetActions: { gap: theme.spacing['sp-3'] },
});
