import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Android's back button runs `onBack` and goes no further, while the screen is mounted. A step the
 * navigator does not know about — the link step is a state of the door, not a route — would
 * otherwise close the app on back.
 */
export function useHardwareBack(onBack: () => void): void {
  const handler = useRef(onBack);
  handler.current = onBack;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handler.current();
      return true;
    });
    return () => subscription.remove();
  }, []);
}
