import type { ReadKind } from '@heliogrid/domain';
import { useEffect, useRef } from 'react';

/**
 * *Try again* leaves with the error state it sits in, so once the panel is back focus goes to its
 * strip's title, which stays — never to the page's start (`RoleCard` does the same).
 */
export function useRetryFocus(read: ReadKind) {
  const target = useRef<HTMLDivElement>(null);
  const retried = useRef(false);
  useEffect(() => {
    if (!retried.current || read !== 'ready') return;
    retried.current = false;
    target.current?.focus({ preventScroll: true });
  }, [read]);
  return {
    target,
    retrying: (run: () => void) => () => {
      retried.current = true;
      run();
    },
  };
}
