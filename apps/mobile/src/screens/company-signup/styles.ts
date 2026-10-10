import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * Company signup's frames at 375, as `SCR-M01-02` draws them inside the door's frame
 * (`DoorFrame`, `@heliogrid/ui`) and its column (`shared/door-styles.ts`): the company step's
 * title and blocks, the known-number steer, the join steer and the request it sent. The step
 * header, the account, the fields and the facts are `@heliogrid/ui`'s (`SignupSteps`,
 * `SignupCompanyStep`).
 */
export const styles = StyleSheet.create({
  /** The company step's title: `sp-6` under the step header, `sp-2` to its intro. */
  titleBlock: { paddingTop: theme.spacing['sp-6'], gap: theme.spacing['sp-2'] },
  /** An off-flow frame's title — the known number: `sp-6 0 sp-5`, no step header above it. */
  offFlowTitle: {
    paddingTop: theme.spacing['sp-6'],
    paddingBottom: theme.spacing['sp-5'],
    gap: theme.spacing['sp-2'],
  },
  /** A tinted block under the title, in the account surface's place. */
  block: { marginTop: theme.spacing['sp-5'] },
  resumeLine: { marginTop: theme.spacing['sp-4'] },
  caption: { marginTop: theme.spacing['sp-5'] },
  /** The steer's two roads under the number as a fact. */
  roads: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
  /** The join steer under the scrolling fields: the finding, then both roads (`SCR-M01-02` decision 9). */
  joinFooter: { gap: theme.spacing['sp-5'] },
  /** The join steer's two roads, 12 apart on the board (`SCR-M01-02` decision 19). */
  joinRoads: { gap: theme.spacing['sp-3'] },
  /** Who the request was sent as: one `Card`, the request-sent frame's focal point; its lines `sp-1` apart. */
  sentAs: { gap: theme.spacing['sp-1'] },
  /** The request-sent title sits deeper than the known number's: `sp-8` above it (board v6). */
  sentTitleTop: { paddingTop: theme.spacing['sp-8'] },
  /** The prompt, centred over the one route back to creating. */
  sentRoute: { gap: theme.spacing['sp-2'] },
});
