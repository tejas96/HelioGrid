import { useEffect, useRef } from 'react';
import type { FocusHandle } from '../SearchField/SearchField.types';

/**
 * The wall's *Try again* takes itself away when the company reads: the focus then lands on door
 * one, where the person goes next, never on the page's start.
 */
export function useFocusAfterWall(unreachable: boolean) {
  const leadAct = useRef<FocusHandle>(null);
  const wasUnreachable = useRef(unreachable);
  useEffect(() => {
    if (wasUnreachable.current && !unreachable) leadAct.current?.focus();
    wasUnreachable.current = unreachable;
  }, [unreachable]);
  return leadAct;
}
