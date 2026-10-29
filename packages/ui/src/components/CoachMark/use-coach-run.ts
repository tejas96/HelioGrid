import type { TranslatedText } from '@heliogrid/contracts';
import { useEffect, useRef, useState } from 'react';
import type { CoachMarkAnchor, CoachMarkSequenceProps, CoachMarkStep } from './CoachMark.types';
import { MAX_STEPS } from './CoachMark.types';

/** What the run hands the mark it is showing — its place in the run and the acts that move it. */
export interface CoachRunMark {
  step: number;
  total: number;
  counterLabel: TranslatedText;
  nextLabel: TranslatedText;
  dismissLabel: TranslatedText;
  onNext: () => void;
  onAnchorMissing: () => void;
}

/** The mark on show: the caller's step, its index (the mark's key) and what the run adds to it. */
export interface CoachRun {
  current: CoachMarkStep;
  index: number;
  mark: CoachRunMark;
}

type CoachRunOptions = Pick<
  CoachMarkSequenceProps,
  'steps' | 'words' | 'onDismiss' | 'onFinish'
> & { open: boolean };

/**
 * Steps whose anchor isn't on this screen are resolved out BEFORE the run starts, so the run
 * begins on the first mark it can actually anchor and the counter numbers only the marks the user
 * will see — "step 2 of 2" as the first and only mark would be a lie. Resolution gets a short grace
 * period for anchors that mount a frame or two late, then freezes for the run so the numbering
 * cannot shift under the user.
 *
 * `isOnScreen` is the half's own way of finding an anchor, and must keep one identity: a new
 * function re-resolves the run and renumbers it under the user, exactly as a new `steps` would.
 */
export function useCoachRun(
  { steps, words, open, onDismiss, onFinish }: CoachRunOptions,
  isOnScreen: (anchor: CoachMarkAnchor) => boolean,
): CoachRun | null {
  const list = steps.slice(0, MAX_STEPS);
  const [shown, setShown] = useState<CoachMarkStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const count = list.length;
  /* The resolved run is frozen for the duration, so the effect reads the steps through a ref: a
     new `steps` array identity every render would re-resolve and renumber the run under the user. */
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  });

  useEffect(() => {
    if (!open) {
      setShown(null);
      return;
    }
    setIndex(0);
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const resolve = () => {
      const found = listRef.current.filter(
        (step) => step.anchor === undefined || isOnScreen(step.anchor),
      );
      tries += 1;
      if (found.length === count || tries >= 4) {
        setShown(found);
        return;
      }
      timer = setTimeout(resolve, 150);
    };
    resolve();
    return () => clearTimeout(timer);
  }, [open, count, isOnScreen]);

  const run = shown ?? [];
  const current = run[index];
  if (!open || current === undefined) {
    return null;
  }
  const hasNext = index + 1 < run.length;
  const advance = () => {
    if (hasNext) {
      setIndex(index + 1);
      return;
    }
    (onFinish ?? onDismiss)?.();
  };
  return {
    current,
    index,
    mark: {
      step: index + 1,
      total: run.length,
      counterLabel: words.counter(index + 1, run.length),
      nextLabel: current.nextLabel ?? (hasNext ? words.next : words.done),
      dismissLabel: words.dismiss,
      onNext: advance,
      onAnchorMissing: () => setIndex((n) => (n === index && hasNext ? index + 1 : n)),
    },
  };
}
