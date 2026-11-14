import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { bodyFit } from './ProposalPages.logic';

/**
 * A page is one sheet of paper, so a body that runs longer than its page — a plan of many parts
 * with the EMI example on — is fitted to it whole rather than cut off or run over the foot: the
 * body is measured at its natural height and scaled down just enough. `1` while it fits, before the
 * first measure, and where `ResizeObserver` is missing.
 */
export function useFittedBody(): readonly [
  RefObject<HTMLDivElement | null>,
  RefObject<HTMLDivElement | null>,
  number,
] {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const room = frame.current;
    const body = content.current;
    if (room === null || body === null || typeof ResizeObserver === 'undefined') return;
    /* The natural height is the body's at the page's own width. A fitted body is laid out wider
       (so that, scaled, it fills the page), and measures shorter there: read at that width, the fit
       would swing between the two. So the width is put back for the read. */
    const read = () => {
      const fitted = body.style.width;
      body.style.width = '100%';
      const natural = body.offsetHeight;
      body.style.width = fitted;
      setScale(bodyFit(room.clientHeight, natural));
    };
    const observer = new ResizeObserver(read);
    observer.observe(room);
    observer.observe(body);
    read();
    return () => observer.disconnect();
  }, []);
  return [frame, content, scale] as const;
}
