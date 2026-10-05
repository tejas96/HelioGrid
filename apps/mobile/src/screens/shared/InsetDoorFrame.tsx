import { DoorFrame, type DoorFrameProps } from '@heliogrid/ui';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './door-styles';

/**
 * The door's frame under the phone's insets. The bloom runs from the screen's top edge, under a
 * transparent status bar (`SCR-M01-01`), so the top inset is the frame's padding — the bloom is
 * placed absolutely and ignores it — while the home-indicator band is added here, on the canvas.
 */
export function InsetDoorFrame(props: DoorFrameProps) {
  const { top } = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.inset} edges={['bottom']}>
      <DoorFrame {...props} style={{ paddingTop: top }} />
    </SafeAreaView>
  );
}
