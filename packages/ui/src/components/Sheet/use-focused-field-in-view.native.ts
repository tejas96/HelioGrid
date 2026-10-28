import { theme } from '@heliogrid/theme';
import { type RefObject, useEffect, useRef } from 'react';
import {
  Keyboard,
  type LayoutChangeEvent,
  type ScrollView,
  TextInput,
  type View,
} from 'react-native';

/** Room kept between the focused field and the body's lower edge, where the sheet's foot begins. */
const ROOM = theme.spacing['sp-3'];

/**
 * Keeps the focused field inside the sheet's scrolling body while the keyboard is up. The sheet
 * rises over the keyboard (`useKeyboardLift`) and its body grows shorter, but a scroll view never
 * follows focus on its own: a field low in the body stays behind the foot, half seen. On each
 * keyboard show or frame change the body scrolls just far enough to show the field whole.
 */
export function useFocusedFieldInView(
  open: boolean,
  scrollTop: RefObject<number>,
): {
  readonly scroll: RefObject<ScrollView | null>;
  readonly content: RefObject<View | null>;
  readonly onBodyLayout: (event: LayoutChangeEvent) => void;
} {
  const scroll = useRef<ScrollView | null>(null);
  const content = useRef<View | null>(null);
  const bodyHeight = useRef(0);
  useEffect(() => {
    if (!open) return;
    const showField = () => {
      const field = TextInput.State.currentlyFocusedInput();
      const inside = content.current;
      if (field === null || inside === null) return;
      field.measureLayout(inside, (_x, y, _width, height) => {
        const top = scrollTop.current;
        const seen = bodyHeight.current - ROOM;
        if (y < top) scroll.current?.scrollTo({ y: Math.max(0, y - ROOM), animated: true });
        else if (y + height > top + seen) {
          scroll.current?.scrollTo({ y: y + height - seen, animated: true });
        }
      });
    };
    const shown = Keyboard.addListener('keyboardDidShow', showField);
    const moved = Keyboard.addListener('keyboardDidChangeFrame', showField);
    return () => {
      shown.remove();
      moved.remove();
    };
  }, [open, scrollTop]);
  return {
    scroll,
    content,
    onBodyLayout: (event) => {
      bodyHeight.current = event.nativeEvent.layout.height;
    },
  };
}
