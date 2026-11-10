import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../primitives/use-reduced-motion';
import type { LottieMomentName, LottieMomentProps } from './LottieMoment.types';

/** Each moment is its own chunk, fetched only when a screen shows it. */
const MOMENTS: Readonly<Record<LottieMomentName, () => Promise<{ default: unknown }>>> = {
  success: () => import('./moments/success.json'),
  saved: () => import('./moments/saved.json'),
  celebrate: () => import('./moments/celebrate.json'),
  sunrise: () => import('./moments/sunrise.json'),
  published: () => import('./moments/published.json'),
  sent: () => import('./moments/sent.json'),
  plan: () => import('./moments/plan.json'),
};

interface Player {
  play: () => void;
  goToAndStop: (frame: number, isFrame: boolean) => void;
  destroy: () => void;
  totalFrames: number;
}

interface Stage {
  container: HTMLElement;
  name: LottieMomentName;
  reduced: boolean;
}

/**
 * Loads the moment the first time its box is in view and plays it once; under reduced motion it
 * shows how it ends. Returns the clean-up.
 */
function stageMoment({ container, name, reduced }: Stage): () => void {
  let player: Player | undefined;
  let gone = false;
  const begin = () => {
    void Promise.all([import('lottie-web/build/player/lottie_light'), MOMENTS[name]()]).then(
      ([lottie, data]) => {
        if (gone) return;
        player = lottie.default.loadAnimation({
          container,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          animationData: data.default,
        });
        if (reduced) player.goToAndStop(player.totalFrames - 1, true);
        else player.play();
      },
    );
  };
  const watch = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting !== true) return;
    watch.disconnect();
    begin();
  });
  watch.observe(container);
  return () => {
    gone = true;
    watch.disconnect();
    player?.destroy();
  };
}

export function LottieMoment({ name, size, label }: LottieMomentProps) {
  const box = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const container = box.current;
    if (container === null) return;
    return stageMoment({ container, name, reduced });
  }, [name, reduced]);
  if (label === undefined) {
    return <span ref={box} className="hg-lottie-moment" data-size={size} aria-hidden="true" />;
  }
  return (
    <span ref={box} className="hg-lottie-moment" data-size={size} role="img" aria-label={label} />
  );
}
