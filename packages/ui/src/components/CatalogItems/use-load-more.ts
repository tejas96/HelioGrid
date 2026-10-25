import { type RefObject, useEffect, useRef } from 'react';

/**
 * A growing list asks for its next page when its foot comes into view — no words to translate, no
 * control to miss. The observer stops while nothing more exists or a page is already out, and when
 * the list leaves the screen.
 */
export function useLoadMore<T extends HTMLElement = HTMLDivElement>(
  wanted: boolean,
  onMore: () => void,
): RefObject<T | null> {
  const foot = useRef<T>(null);
  const more = useRef(onMore);
  useEffect(() => {
    more.current = onMore;
  }, [onMore]);
  useEffect(() => {
    const node = foot.current;
    if (!wanted || node === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting === true) more.current();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [wanted]);
  return foot;
}
