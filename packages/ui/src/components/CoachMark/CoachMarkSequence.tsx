import { useEffect, useRef, useState } from 'react';
import { CoachMark } from './CoachMark';
import type { CoachMarkSequenceProps, CoachMarkStep } from './CoachMark.types';
import { MAX_STEPS } from './CoachMark.types';
import { resolveNode } from './use-anchor-rect';

/**
 * An ordered run of at most three marks over one live screen (search → confirm → next).
 *
 * Steps whose anchor isn't on this screen are resolved out BEFORE the run starts, so the run
 * begins on the first mark it can actually anchor and the counter numbers only the marks the user
 * will see — "step 2 of 2" as the first and only mark would be a lie. Resolution gets a short grace
 * period for anchors that mount a frame or two late, then freezes for the run so the numbering
 * cannot shift under the user.
 */
export function CoachMarkSequence({
  steps,
  open = true,
  within,
  onDismiss,
  onFinish,
  autoFocus = true,
}: CoachMarkSequenceProps) {
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
        (step) => step.anchor === undefined || resolveNode(step.anchor),
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
  }, [open, count]);

  const run = shown ?? [];
  const current = run[index];
  if (!open || current === undefined) {
    return null;
  }
  const advance = () => {
    if (index + 1 < run.length) {
      setIndex(index + 1);
      return;
    }
    (onFinish ?? onDismiss)?.();
  };
  return (
    <CoachMark
      {...current}
      key={index}
      within={current.within ?? within}
      step={index + 1}
      total={run.length}
      open
      autoFocus={autoFocus}
      onNext={advance}
      onDismiss={onDismiss}
      onAnchorMissing={() =>
        setIndex((n) => (n === index && index + 1 < run.length ? index + 1 : n))
      }
    />
  );
}
