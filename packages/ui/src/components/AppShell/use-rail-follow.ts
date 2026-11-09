import { theme } from '@heliogrid/theme';
import { type RefObject, useEffect } from 'react';
import { useReducedMotion } from '../../primitives/use-reduced-motion';

const bezier = (b: readonly number[]) => `cubic-bezier(${b.join(',')})`;

/**
 * When the sidebar folds or opens, its width changes in one frame — a width never animates, since
 * it lays the page out again on every frame. So the move is played back by transform: the page
 * slides from where it stood to its new place, and the sidebar's panel (`.hg-app-rail::before`)
 * stretches from its old width to its new one. While the sidebar opens, `data-moving="open"` lets
 * its words fade in once the page has cleared their room (`AppRailFolded.css`). The sidebar showing
 * or leaving at the desktop breakpoint is no fold, and moves nothing.
 */
export function useRailFollow(
  railBox: RefObject<HTMLDivElement | null>,
  column: RefObject<HTMLDivElement | null>,
): void {
  const reduced = useReducedMotion();
  useEffect(() => {
    const box = railBox.current;
    const page = column.current;
    if (box === null || page === null || reduced || typeof ResizeObserver === 'undefined') return;
    const timing: KeyframeAnimationOptions = {
      duration: theme.motion.durations.emphasised,
      easing: bezier(theme.motion.easings.standard),
    };
    let width = box.getBoundingClientRect().width;
    const watch = new ResizeObserver(() => {
      const from = width;
      width = box.getBoundingClientRect().width;
      if (from === 0 || width === 0 || from === width) return;
      page.animate(
        [{ transform: `translateX(${from - width}px)` }, { transform: 'translateX(0)' }],
        timing,
      );
      box
        .querySelector('.hg-app-rail')
        ?.animate([{ transform: `scaleX(${from / width})` }, { transform: 'scaleX(1)' }], {
          ...timing,
          pseudoElement: '::before',
        });
      if (width > from) {
        box.dataset.moving = 'open';
        window.setTimeout(() => delete box.dataset.moving, theme.motion.durations.emphasised * 2);
      }
    });
    watch.observe(box);
    return () => watch.disconnect();
  }, [railBox, column, reduced]);
}
