import { type RefObject, useEffect, useState } from 'react';
import { useReducedMotion } from '../../primitives/use-reduced-motion';

/**
 * Whether an ambient loop may run now: the person has not asked for reduced motion, the tab is in
 * front and the element is on screen. A loop reads this and pauses the moment it turns false.
 */
export function useAmbientRun(ref: RefObject<Element | null>): boolean {
  const reduced = useReducedMotion();
  const [onScreen, setOnScreen] = useState(true);
  const [front, setFront] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) setOnScreen(entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const follow = () => setFront(document.visibilityState === 'visible');
    follow();
    document.addEventListener('visibilitychange', follow);
    return () => document.removeEventListener('visibilitychange', follow);
  }, []);

  return !reduced && onScreen && front;
}
