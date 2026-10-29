import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The bubble opens only once the pointer, focus or finger has stayed for `delay` ms, and closes at
 * once — so a passing pointer or an ordinary tap never opens it. The pending open is cancelled on
 * unmount.
 */
export function useDelayedOpen(delay: number): {
  open: boolean;
  show: () => void;
  hide: () => void;
} {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { open, show, hide };
}
