import { type RefObject, useContext, useEffect } from 'react';
import { BarScrollContext, frostAt, titleAt } from './MobileTopBar.logic';

/**
 * Web halves: under a frame that tells its scroll, a bar's band and title strengths ride it as two
 * custom properties, `--hg-bar-frost` and `--hg-bar-title`, set once a frame from the distance;
 * with none, the bar's own style holds them (`MobileTopBar.css`, `AppShell.css`).
 */
export function useBarFade(bar: RefObject<HTMLElement | null>) {
  const scroll = useContext(BarScrollContext);
  useEffect(() => {
    const element = bar.current;
    if (scroll === null || element === null) return;
    let frame = 0;
    const paint = (offset: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty('--hg-bar-frost', String(frostAt(offset)));
        element.style.setProperty('--hg-bar-title', String(titleAt(offset)));
      });
    };
    paint(scroll.current());
    const stop = scroll.subscribe(paint);
    return () => {
      stop();
      cancelAnimationFrame(frame);
    };
  }, [scroll, bar]);
}
