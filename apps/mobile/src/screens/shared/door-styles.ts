import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * The door's column at 375, as `SCR-M01-01` and `SCR-M01-02` draw it inside the frame
 * `@heliogrid/ui` owns (`DoorFrame`): the inset behind the frame, the title block, the form, the
 * road at the foot, the code family's rows and the switch sheet's body. Shared by the sign-in door
 * and company signup.
 */
export const styles = StyleSheet.create({
  /** The inset behind the frame: the page, so the status-bar and home-indicator bands match the frame's ground. */
  // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
  inset: { flex: 1, backgroundColor: theme.colors.surface },
  titleBlock: {
    gap: theme.spacing['sp-2'],
    paddingBottom: theme.spacing['sp-6'],
  },
  /**
   * Above the title: grows as much as `spacer` below the form, so the title and the form sit
   * centred between the header and the road at the foot (`SCR-M01-01`); never under `sp-8`.
   */
  spacerTop: { flex: 1, minHeight: theme.spacing['sp-8'] },
  form: { gap: theme.spacing['sp-5'] },
  /** The "or" and Continue with Google: `sp-5` above (the form's gap), `sp-3` between (`SCR-M01-01`). */
  google: { gap: theme.spacing['sp-3'] },
  /** The locked frame's way still open: the sentence, `sp-4`, then Continue with Google (`M01-04`). */
  lockedGoogle: { gap: theme.spacing['sp-4'] },
  spacer: { flex: 1, minHeight: theme.spacing['sp-6'] },
  /** The road at the foot of the number step: the question and where it goes. */
  road: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The code column, centred in the space under the header (`SCR-M01-01`); at least `sp-6` above and below. */
  codeColumn: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: theme.spacing['sp-5'],
    paddingVertical: theme.spacing['sp-6'],
  },
  /** Under a step header the code column keeps the title block's `sp-8` above it (the signup export). */
  codeColumnAfterLead: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: theme.spacing['sp-5'],
    paddingTop: theme.spacing['sp-8'],
    paddingBottom: theme.spacing['sp-6'],
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
