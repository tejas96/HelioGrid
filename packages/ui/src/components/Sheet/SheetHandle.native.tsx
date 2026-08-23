import { theme } from '@heliogrid/theme';
import type { PanResponderInstance } from 'react-native';
import { StyleSheet, View } from 'react-native';

interface SheetHandleProps {
  /** With a header below it the handle takes the roomier bottom padding. */
  hasHeader: boolean;
  /** The drag recogniser. Its handlers are spread onto the bar, which IS the drag target. */
  pan: PanResponderInstance;
}

/**
 * The 36×4 grab bar, and the sheet's drag target.
 *
 * It is a redundant TOUCH affordance: the backdrop tap and the 44×44 close button reach the same
 * dismissal without it, so nothing is reachable by drag alone.
 */
export function SheetHandle({ hasHeader, pan }: SheetHandleProps) {
  return (
    <View
      {...pan.panHandlers}
      style={[styles.handle, hasHeader ? styles.handleWithHeader : undefined]}
    >
      <View style={styles.handleBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingTop: theme.spacing['sp-5'],
    paddingBottom: 6,
    flexShrink: 0,
  },
  handleWithHeader: { paddingBottom: theme.spacing['sp-5'] },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: theme.radius['r-pill'],
    backgroundColor: theme.colors['canvas-sunken'],
  },
});
