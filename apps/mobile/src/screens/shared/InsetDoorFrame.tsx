import { DoorFrame, type DoorFrameProps } from '@heliogrid/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './door-styles';

/**
 * The door's frame under the phone's insets. The export's 375×812 frame starts under the status
 * bar, and the package's frame holds no platform adapter, so the status-bar and home-indicator
 * bands are added here, on the canvas, and never drawn into the column.
 */
export function InsetDoorFrame(props: DoorFrameProps) {
  return (
    <SafeAreaView style={styles.inset} edges={['top', 'bottom']}>
      <DoorFrame {...props} />
    </SafeAreaView>
  );
}
