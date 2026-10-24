import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle, type View } from 'react-native';

/**
 * *Try again* leaves with the error state it sits in, so once the panel is back the reader's focus
 * goes to its strip's title, which stays (`RoleCard` does the same).
 */
export function useRetryFocus(surface: 'loading' | 'error' | 'ready') {
  const target = useRef<View>(null);
  const retried = useRef(false);
  useEffect(() => {
    if (!retried.current || surface !== 'ready') return;
    retried.current = false;
    const tag = findNodeHandle(target.current);
    if (tag !== null) AccessibilityInfo.setAccessibilityFocus(tag);
  }, [surface]);
  return {
    target,
    retrying: (run: () => void) => () => {
      retried.current = true;
      run();
    },
  };
}
