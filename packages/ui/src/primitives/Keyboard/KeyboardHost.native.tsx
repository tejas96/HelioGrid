import { KeyboardProvider } from 'react-native-keyboard-controller';
import type { KeyboardHostProps } from './Keyboard.types';

/**
 * The one keyboard host, at the app's root. React Native already draws the app edge to edge on
 * Android, which the library reads for itself — its translucency props are ignored there and only
 * raise a warning — so the keyboard's height is measured from the screen's own bottom on both
 * phones.
 */
export function KeyboardHost({ children }: KeyboardHostProps) {
  return <KeyboardProvider>{children}</KeyboardProvider>;
}
