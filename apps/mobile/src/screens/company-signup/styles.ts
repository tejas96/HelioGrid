import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * Company signup's two off-flow frames at 375, as `SCR-M01-02` draws them inside the door's frame
 * (`DoorFrame`, `@heliogrid/ui`) and its column (`shared/door-styles.ts`): the known-number steer
 * and the request sent. The step header and step 3 are `@heliogrid/ui`'s (`SignupSteps`,
 * `SignupCompanyStep`).
 */
export const styles = StyleSheet.create({
  /** An off-flow frame's title — the known number: `sp-6 0 sp-5`, no step header above it. */
  offFlowTitle: {
    paddingTop: theme.spacing['sp-6'],
    paddingBottom: theme.spacing['sp-5'],
    gap: theme.spacing['sp-2'],
  },
  /** The steer's two roads under the number as a fact. */
  roads: { gap: theme.spacing['sp-5'], paddingTop: theme.spacing['sp-5'] },
  /** Who the request was sent as: one `Card`, the request-sent frame's focal point; its lines `sp-1` apart. */
  sentAs: { gap: theme.spacing['sp-1'] },
  /** The request-sent title sits deeper than the known number's: `sp-8` above it (board v6). */
  sentTitleTop: { paddingTop: theme.spacing['sp-8'] },
  /** The prompt, centred over the one route back to creating. */
  sentRoute: { gap: theme.spacing['sp-2'] },
});
