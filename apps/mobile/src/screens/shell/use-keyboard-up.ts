import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/* iOS tells the app before the keyboard moves; Android only once it has. */
const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/**
 * Whether the system keyboard is up. The shell hides its floating pill while it is: lifted with
 * the page above the keyboard, the pill would sit over the field being typed in.
 */
export function useKeyboardUp(): boolean {
  const [up, setUp] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener(SHOW, () => setUp(true));
    const hidden = Keyboard.addListener(HIDE, () => setUp(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  return up;
}
