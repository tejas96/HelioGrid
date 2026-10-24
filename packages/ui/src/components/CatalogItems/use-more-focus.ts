import { useEffect, useRef } from 'react';

/**
 * *Show more* leaves once the last page lands, and the reader's focus would fall to the page's
 * start; it goes instead to the list the button grew. The target takes focus without being a
 * control (`tabIndex={-1}`), so it may hold the rows.
 */
export function useMoreFocus<Target extends HTMLElement>(hasMore: boolean) {
  const target = useRef<Target>(null);
  const pressed = useRef(false);
  useEffect(() => {
    if (hasMore || !pressed.current) return;
    pressed.current = false;
    target.current?.focus();
  }, [hasMore]);
  return {
    target,
    pressing: (run: () => void) => () => {
      pressed.current = true;
      run();
    },
  };
}
