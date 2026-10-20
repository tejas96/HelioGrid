import { AccessibilityInfo, findNodeHandle } from 'react-native';

/**
 * Moves the screen reader's focus to a view on the phone — never the keyboard's, which would open
 * the soft keyboard over the page. It waits one turn and reads the view then, so a change the caller
 * just made (a chip chosen, a sheet closed) has rendered first: VoiceOver ignores a view behind a
 * sheet that is still mounted, and a chip chosen this turn is not yet the chosen one.
 */
export function focusScreenReaderOn(view: () => object | null): void {
  setTimeout(() => {
    const tag = findNodeHandle(view() as Parameters<typeof findNodeHandle>[0]);
    if (tag !== null) AccessibilityInfo.setAccessibilityFocus(tag);
  }, 0);
}
