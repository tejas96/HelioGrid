import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Android's back button runs `onBack` and goes no further, while the screen is mounted. A step the
 * navigator does not know about — the link step is a state of the door, not a route — would
 * otherwise close the app on back. `onBack` returning `false` passes the back on: a screen still
 * mounted under another one (the studio under Site details) is not the one the back is for.
 */
export function useHardwareBack(onBack: () => unknown): void {
  const handler = useRef(onBack);
  handler.current = onBack;
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => handler.current() !== false,
    );
    return () => subscription.remove();
  }, []);
}
