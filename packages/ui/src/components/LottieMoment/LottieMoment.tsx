import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../primitives/use-reduced-motion';
import type { LottieMomentName, LottieMomentProps } from './LottieMoment.types';

/** Each moment is its own chunk, fetched only when a screen shows it. */
const MOMENTS: Readonly<Record<LottieMomentName, () => Promise<{ default: unknown }>>> = {
  success: () => import('./moments/success.json'),
  celebrate: () => import('./moments/celebrate.json'),
  empty: () => import('./moments/empty.json'),
};

export function LottieMoment({ name, size, label }: LottieMomentProps) {
  const box = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const container = box.current;
    if (container === null) return;
    let stop: (() => void) | undefined;
    let gone = false;
    const begin = () => {
      void Promise.all([import('lottie-web/build/player/lottie_light'), MOMENTS[name]()]).then(
        ([lottie, data]) => {
          if (gone) return;
          const animation = lottie.default.loadAnimation({
            container,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: data.default,
          });
          if (reduced) animation.goToAndStop(animation.totalFrames - 1, true);
          else animation.play();
          stop = () => animation.destroy();
        },
      );
    };
    // Plays once, the first time it is in view: a moment below the fold waits for its person.
    const watch = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting !== true) return;
      watch.disconnect();
      begin();
    });
    watch.observe(container);
    return () => {
      gone = true;
      watch.disconnect();
      stop?.();
    };
  }, [name, reduced]);
  if (label === undefined) {
    return <span ref={box} className="hg-lottie-moment" data-size={size} aria-hidden="true" />;
  }
  return (
    <span ref={box} className="hg-lottie-moment" data-size={size} role="img" aria-label={label} />
  );
}
