import { theme } from '@heliogrid/theme';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { AppShellProps } from './AppShell.types';

interface NativeAppShellProps extends AppShellProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Rail on the left, header on top, content below. The web's `overflow: auto` main has no RN
 * equivalent here — scrolling belongs to the screen's own ScrollView or list, so this is a plain
 * flex region and never a second scroll container.
 */
export function AppShell({ rail, header, children, style }: NativeAppShellProps) {
  return (
    <View style={[styles.shell, style]}>
      {rail}
      <View style={styles.column}>
        {header}
        <View style={styles.main}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    backgroundColor: theme.colors.canvas,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  main: {
    flex: 1,
    minHeight: 0,
  },
});
