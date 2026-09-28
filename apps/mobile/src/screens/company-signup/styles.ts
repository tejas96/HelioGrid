import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * Company signup's frames at 375, as `SCR-M01-02` draws them inside the door's frame
 * (`DoorFrame`, `@heliogrid/ui`) and its column (`shared/door-styles.ts`): the step header under
 * the header row, the company step's title, the account surface, the three fields, the loading
 * facts and the known-number steer.
 */
export const styles = StyleSheet.create({
  /** The step header: `sp-6` under the header row (the export's lead block). */
  lead: { paddingTop: theme.spacing['sp-6'] },
  /** The company step's title: `sp-6` under the step header, `sp-2` to its intro. */
  titleBlock: { paddingTop: theme.spacing['sp-6'], gap: theme.spacing['sp-2'] },
  /** The known-number frame's title: `sp-6 0 sp-5`, no step header above it. */
  knownTitle: {
    paddingTop: theme.spacing['sp-6'],
    paddingBottom: theme.spacing['sp-5'],
    gap: theme.spacing['sp-2'],
  },
  /**
   * The verified number as a fact on the page, the chip at the right — no surface (`F7-49`): a grey
   * tile would make it look like the fields below it, and a white card vanishes on the white page.
   */
  accountCard: {
    marginTop: theme.spacing['sp-5'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
  },
  /** A tinted block under the title, in the account surface's place. */
  block: { marginTop: theme.spacing['sp-5'] },
  resumeLine: { marginTop: theme.spacing['sp-4'] },
  fields: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-6'] },
  fieldsAfterBlock: { paddingTop: theme.spacing['sp-5'] },
  /** The three values as facts while they are written, on the page with no surface (`F7-49`). */
  facts: {
    marginTop: theme.spacing['sp-6'],
    gap: theme.spacing['sp-4'],
  },
  fact: { gap: theme.spacing['sp-1'] },
  caption: { marginTop: theme.spacing['sp-5'] },
  /** The steer's two roads under the number as a fact. */
  roads: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
});
