import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

export interface ImageLoad {
  /** Goes on the `<img>` this hook is watching. */
  img: RefObject<HTMLImageElement | null>;
  loaded: boolean;
  failed: boolean;
  onLoad: () => void;
  onError: () => void;
}

/**
 * Whether THIS src has decoded — web only, because it answers a DOM-only problem.
 *
 * A cached photo or a data: URI finishes loading before React attaches `onLoad`, so the event
 * never arrives and the frame would shimmer forever — worst in the print case this component
 * exists for. The element's own completion state is read on every src change; the ordinary case
 * still arrives through `onLoad` / `onError`.
 *
 * (React Native decodes on mount and always fires `onLoad`, so its half keeps the state keyed by
 * source instead and needs no reset effect.)
 */
export function useImageLoad(src: string | undefined): ImageLoad {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    const n = img.current;
    if (!src || !n) return;
    if (n.complete && n.currentSrc) {
      if (n.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, [src]);

  return {
    img,
    loaded,
    failed,
    onLoad: () => setLoaded(true),
    onError: () => setFailed(true),
  };
}
