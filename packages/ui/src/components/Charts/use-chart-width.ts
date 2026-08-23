import { useEffect, useRef, useState } from 'react';

/**
 * The measured width of the plot wrapper. Bar spacing and the line chart's viewBox are laid out
 * against real pixels, so the surface reflows rather than squashing at 375px. Web only — the
 * native halves read the same number from `onLayout`.
 */
export function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, width };
}
