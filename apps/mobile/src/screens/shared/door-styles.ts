import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * The door's column at 375, as `SCR-M01-01` and `SCR-M01-02` draw it inside the frame
 * `@heliogrid/ui` owns (`DoorFrame`): the inset behind the frame, the title block, the form, the
 * road at the foot, the code family's rows and the switch sheet's body. Shared by the sign-in door
 * and company signup.
 */
export const styles = StyleSheet.create({
  /** The inset behind the frame: the canvas, so the status-bar and home-indicator bands match the frame's ground. */
  inset: { flex: 1, backgroundColor: theme.colors.canvas },
  titleBlock: {
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-8'],
    paddingBottom: theme.spacing['sp-6'],
  },
  form: { gap: theme.spacing['sp-5'] },
  or: { alignItems: 'center', gap: theme.spacing['sp-3'] },
  caption: { marginTop: theme.spacing['sp-4'] },
  spacer: { flex: 1, minHeight: theme.spacing['sp-6'] },
  /** The road at the foot of the number step: the question and where it goes. */
  road: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The export's code column: `sp-5` between the header row and the title, then `sp-5` throughout. */
  codeColumn: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
  /** Under a step header the code column keeps the title block's `sp-8` (the signup export). */
  codeColumnAfterLead: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-8'] },
  codeTitle: { gap: theme.spacing['sp-1'] },
  centred: { alignItems: 'center' },
  callBlock: { gap: theme.spacing['sp-2'] },
  sheetBody: { gap: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-2'] },
  sheetActions: { gap: theme.spacing['sp-3'] },
});
