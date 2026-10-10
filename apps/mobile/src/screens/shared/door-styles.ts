import { theme } from '@heliogrid/theme';
import { StyleSheet } from 'react-native';

/**
 * The door's column at 375, as `SCR-M01-01` and `SCR-M01-02` draw it inside the frame
 * `@heliogrid/ui` owns (`DoorFrame` and the steps it holds): the inset behind the frame, and the
 * rows the signup frames this app still composes share.
 */
export const styles = StyleSheet.create({
  /** The inset behind the frame: the page, so the status-bar and home-indicator bands match the frame's ground. */
  // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
  inset: { flex: 1, backgroundColor: theme.colors.surface },
  /** Takes the free height under an off-flow frame's task; never under `sp-6`. */
  spacer: { flex: 1, minHeight: theme.spacing['sp-6'] },
  /** A door title and its Explainer on one row, `sp-2` apart. */
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing['sp-2'] },
  /** The title gives way and wraps, so a long one never pushes its Explainer off the screen. */
  titleText: { flexShrink: 1 },
  centred: { alignItems: 'center' },
});
