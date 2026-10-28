import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { KeyboardController, KeyboardEvents } from 'react-native-keyboard-controller';

function heightNow(): number {
  return KeyboardController.isVisible() ? KeyboardController.state().height : 0;
}

/**
 * The on-screen keyboard's height, `0` while it is down. It drops to `0` as the keyboard starts to
 * leave (`keyboardWillHide`), so a lifted sheet and the shell's pill move with it rather than after
 * it; a new height while it is up (another keyboard type) is taken as it shows.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(heightNow);
  useEffect(() => {
    const shown = ['keyboardWillShow', 'keyboardDidShow'] as const;
    const gone = ['keyboardWillHide', 'keyboardDidHide'] as const;
    const listeners = [
      ...shown.map((event) => KeyboardEvents.addListener(event, (e) => setHeight(e.height))),
      ...gone.map((event) => KeyboardEvents.addListener(event, () => setHeight(0))),
    ];
    return () => {
      for (const listener of listeners) listener.remove();
    };
  }, []);
  return height;
}

/** Whether the on-screen keyboard is up — the shell's pill steps aside while it is. */
export function useKeyboardUp(): boolean {
  return useKeyboardHeight() > 0;
}

/**
 * Lowers the keyboard and lets the focused field go at once, in this frame: a field about to unmount
 * must lose focus first, or Android hands the keyboard to the page's next field.
 */
export function closeKeyboard(): void {
  Keyboard.dismiss();
}
