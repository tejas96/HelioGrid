import { DoorFrame, type DoorFrameProps, DoorTopInset } from '@heliogrid/ui';
import type { ReactNode } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './door-styles';

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

/** The frame itself under the insets, for a door part this app still composes. */
export function InsetDoorFrame(props: DoorFrameProps) {
  return (
    <InsetDoor>
      <DoorFrame {...props} />
    </InsetDoor>
  );
}
