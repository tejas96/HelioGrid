import { theme } from '@heliogrid/theme';
import { DoorBottomInset, DoorTopInset } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A door under the phone's insets. The bloom runs from the screen's top edge, under a transparent
 * status bar (`SCR-M01-01`), so the top inset is handed to the frame as its padding — the bloom is
 * placed absolutely and ignores it. The home-indicator band is handed in too: the frame keeps it in
 * its footer, which rides on the keyboard and drops the band behind it.
 */
export function InsetDoor({ children }: { children: ReactNode }) {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <View style={styles.inset}>
      <DoorTopInset.Provider value={top}>
        <DoorBottomInset.Provider value={bottom}>{children}</DoorBottomInset.Provider>
      </DoorTopInset.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  /** The inset behind the frame: the page, so the status-bar and home-indicator bands match the frame's ground. */
  // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
  inset: { flex: 1, backgroundColor: theme.colors.surface },
});
