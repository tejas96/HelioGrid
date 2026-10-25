import { useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';

/**
 * The screen reader's focus on a card the moment it appears, when `focus` asks: a fix removes the
 * card that was pressed, so its settled card — or, after *Undo*, the card that returns — takes it.
 */
export function useFocusOnMount(focus: boolean) {
  const target = useRef<View>(null);
  useEffect(() => {
    if (focus) focusScreenReaderOn(() => target.current);
  }, [focus]);
  return target;
}
