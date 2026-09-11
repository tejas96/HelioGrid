import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * The door's frame at 375, as `SCR-M01-01` and `SCR-M01-02` draw it: the canvas, the brand bloom
 * (`BrandBloom`, the design system's) behind the top of the column, `--sp-6` above and below, the
 * market's mobile screen padding at the sides. Shared by the sign-in door and company signup.
 */
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas },
  /** The layers over the bloom paint nothing, so the wash shows through the column. */
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  column: {
    flex: 1,
    paddingVertical: theme.spacing['sp-6'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  titleBlock: {
    gap: theme.spacing['sp-2'],
    paddingTop: theme.spacing['sp-8'],
    paddingBottom: theme.spacing['sp-6'],
  },
  /** With a footer the column's bottom padding moves to the footer, so the action sits `sp-6` under the last line. */
  columnAboveFooter: { paddingBottom: 0 },
  footer: {
    paddingTop: theme.spacing['sp-6'],
    paddingBottom: theme.spacing['sp-6'],
    paddingHorizontal: theme.layout['screen-pad-mobile'],
  },
  form: { gap: theme.spacing['sp-5'] },
  or: { alignItems: 'center', gap: theme.spacing['sp-3'] },
  caption: { marginTop: theme.spacing['sp-4'] },
  spacer: { flex: 1, minHeight: theme.spacing['sp-6'] },
  door: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The export's code column: `sp-5` between the header row and the title, then `sp-5` throughout. */
  codeColumn: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
  /** Under a step header the code column keeps the title block's `sp-8` (the signup export). */
  codeColumnAfterLead: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-8'] },
  codeTitle: { gap: theme.spacing['sp-1'] },
  centred: { alignItems: 'center' },
  callBlock: { gap: theme.spacing['sp-2'] },
  tinted: {
    gap: theme.spacing['sp-1'],
    padding: theme.spacing['sp-4'],
    borderRadius: theme.radius['r-card-expressive'],
  },
  tintedDanger: { backgroundColor: theme.colors['danger-bg'] },
  tintedWarning: { backgroundColor: theme.colors['warning-bg'] },
  tintedInfo: { backgroundColor: theme.colors['info-bg'] },
  dwell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing['sp-6'],
    backgroundColor: theme.colors.canvas,
  },
  dwellMark: {
    width: theme.spacing['sp-20'],
    height: theme.spacing['sp-20'],
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['success-bg'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dwellWords: { alignItems: 'center', gap: theme.spacing['sp-2'] },
  sheetBody: { gap: theme.spacing['sp-4'], paddingBottom: theme.spacing['sp-2'] },
  sheetActions: { gap: theme.spacing['sp-3'] },
});
