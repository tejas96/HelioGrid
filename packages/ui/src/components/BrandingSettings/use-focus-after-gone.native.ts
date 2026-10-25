import { type RefObject, useEffect, useRef } from 'react';
import type { View } from 'react-native';
import { focusScreenReaderOn } from '../../primitives/screen-reader-focus.native';

/** What a press can make go: the act bar (saved or discarded), the save's banner, the logo (removed). */
interface Goers {
  readonly act: boolean;
  readonly failure: boolean;
  readonly logo: boolean;
}

/**
 * The phone's half of the web's rule: a control that takes itself away would leave the screen
 * reader at the page's start, so when one goes its focus moves to the editor — the part's switch
 * and the part, where the person goes next. The keyboard's focus is never moved (it would open the
 * soft keyboard). It follows an act bar this page draws (`act`); one in the shell's foot is the
 * shell's, and a held change typed back to the saved value cannot be told from a save from here, so
 * a press of that bar moves nothing.
 */
export function useFocusAfterGone(editor: RefObject<View | null>, now: Goers): void {
  const was = useRef(now);
  useEffect(() => {
    const before = was.current;
    was.current = now;
    const gone =
      (before.logo && !now.logo) || (before.act && !now.act) || (before.failure && !now.failure);
    if (gone) focusScreenReaderOn(() => editor.current);
  });
}
