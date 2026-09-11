import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * Company signup's frames at 375, as `SCR-M01-02` draws them over the door's frame
 * (`shared/door-styles.ts`): the step header under the header row, the company step's title,
 * the account surface, the three fields, the loading facts and the known-number steer.
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
  /** The verified number's surface: `sp-4 sp-5` inside, `e1`, the chip at the right. */
  accountCard: {
    marginTop: theme.spacing['sp-5'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing['sp-3'],
    paddingVertical: theme.spacing['sp-4'],
    paddingHorizontal: theme.spacing['sp-5'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    ...theme.elevation.e1,
  },
  /** A tinted block under the title, in the account surface's place. */
  block: { marginTop: theme.spacing['sp-5'] },
  resumeLine: { marginTop: theme.spacing['sp-4'] },
  fields: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-6'] },
  fieldsAfterBlock: { paddingTop: theme.spacing['sp-5'] },
  /** The three values as facts while they are written: one surface, `sp-4` between rows. */
  facts: {
    marginTop: theme.spacing['sp-6'],
    gap: theme.spacing['sp-4'],
    padding: theme.spacing['sp-5'],
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius['r-card-expressive'],
    ...theme.elevation.e1,
  },
  fact: { gap: theme.spacing['sp-1'] },
  caption: { marginTop: theme.spacing['sp-5'] },
  /** The steer's two roads under the number as a fact. */
  roads: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
});
