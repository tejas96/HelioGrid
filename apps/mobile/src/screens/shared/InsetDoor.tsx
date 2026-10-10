import { theme } from '@heliogrid/theme';
import { DoorTopInset } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * A door under the phone's insets. The bloom runs from the screen's top edge, under a transparent
 * status bar (`SCR-M01-01`), so the top inset is handed to the frame as its padding — the bloom is
 * placed absolutely and ignores it — while the home-indicator band is added here, on the canvas.
 */
export function InsetDoor({ children }: { children: ReactNode }) {
  const { top } = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.inset} edges={['bottom']}>
      <DoorTopInset.Provider value={top}>{children}</DoorTopInset.Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /** The inset behind the frame: the page, so the status-bar and home-indicator bands match the frame's ground. */
  // biome-ignore lint/plugin/raw-white: page-ground — an app's page or door: the page is white
  inset: { flex: 1, backgroundColor: theme.colors.surface },
});
