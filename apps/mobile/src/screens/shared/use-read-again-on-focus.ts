import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

/**
 * A screen kept in the stack is not mounted again when it comes back into view, so its read never
 * asked again and a record made elsewhere stayed missing until a restart: each return to the screen
 * (not its first showing) hands the read its chance to ask again. The app's own return to the
 * foreground is `react-query-host.tsx`'s.
 */
export function useReadAgainOnFocus(readAgain: () => void): void {
  const latest = useRef(readAgain);
  latest.current = readAgain;
  const shown = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (shown.current) latest.current();
      shown.current = true;
    }, []),
  );
}
