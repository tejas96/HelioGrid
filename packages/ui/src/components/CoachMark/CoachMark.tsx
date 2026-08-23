import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import type { CoachMarkProps } from './CoachMark.types';
import { MAX_STEPS } from './CoachMark.types';
import {
  CoachMarkArrow,
  CoachMarkFoot,
  CoachMarkHead,
  CoachMarkRing,
  coachMarkShell,
} from './CoachMarkParts';
import { COACH_MARK_FALLBACK_HEIGHT, coachMarkCounter, placeCoachMark } from './coach-mark-place';
import { useAnchorRect } from './use-anchor-rect';
import { useCoachMarks } from './use-coach-marks';

interface WebCoachMarkProps extends CoachMarkProps {
  className?: string;
  style?: CSSProperties;
}

function viewport() {
  return typeof window === 'undefined'
    ? { width: 1024, height: 768 }
    : { width: window.innerWidth, height: window.innerHeight };
}

/** One persistent mark anchored to a live control. Escape dismisses; the screen stays usable. */
export function CoachMark({
  anchor,
  within,
  title,
  body,
  step,
  total,
  open = true,
  placement = 'auto',
  padding = 6,
  width = 292,
  nextLabel,
  dismissLabel = 'Dismiss',
  onNext,
  onDismiss,
  onAnchorMissing,
  autoFocus = true,
  ring = true,
  className,
  style,
}: WebCoachMarkProps) {
  const rect = useAnchorRect(anchor, within, open, onAnchorMissing);
  const card = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(0);

  useLayoutEffect(() => {
    if (card.current !== null) {
      setCardHeight(card.current.offsetHeight);
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `step` is deliberate — the mark takes focus again when a sequence advances, so a keyboard user follows the run.
  useEffect(() => {
    if (open && autoFocus && card.current !== null) {
      card.current.focus({ preventScroll: true });
    }
  }, [open, step, autoFocus]);

  if (!open) {
    return null;
  }
  /* Anchored but unresolvable: draw nothing rather than point at nothing. */
  if (anchor !== undefined && rect === null) {
    return null;
  }

  const { steps, counter, isLast } = coachMarkCounter(total, step, MAX_STEPS);
  const placed =
    rect === null
      ? null
      : placeCoachMark(
          rect,
          width,
          cardHeight || COACH_MARK_FALLBACK_HEIGHT,
          placement,
          viewport(),
        );

  return (
    <>
      {ring && rect !== null ? <CoachMarkRing rect={rect} padding={padding} /> : null}
      {/* biome-ignore lint/a11y/useSemanticElements: a fieldset is a form group; this is guidance over a live screen — it groups no controls of its own and traps nothing (M01-16, MS1-08). */}
      <div
        ref={card}
        role="group"
        tabIndex={-1}
        aria-label={counter === null ? title : `${title}. ${counter}`}
        className={classNames('hg-coach-mark', className)}
        data-anchored={rect === null ? undefined : 'true'}
        style={{ ...coachMarkShell(rect, placed, width), ...style }}
      >
        {placed === null ? null : <CoachMarkArrow placed={placed} />}
        <CoachMarkHead
          counter={counter}
          title={title}
          dismissLabel={dismissLabel}
          onDismiss={onDismiss}
        />
        {body === undefined ? null : <p className="hg-coach-mark-body">{body}</p>}
        <CoachMarkFoot
          steps={steps}
          step={step}
          isLast={isLast}
          nextLabel={nextLabel}
          onNext={onNext}
          onDismiss={onDismiss}
        />
      </div>
    </>
  );
}

CoachMark.useCoachMarks = useCoachMarks;

export { useCoachMarks };
