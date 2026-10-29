import { CoachMark } from './CoachMark';
import type { CoachMarkAnchor, CoachMarkSequenceProps } from './CoachMark.types';
import { resolveNode } from './use-anchor-rect';
import { useCoachRun } from './use-coach-run';

/** A step stays in the run only while this half can find its anchor on screen. */
function isOnScreen(anchor: CoachMarkAnchor): boolean {
  return resolveNode(anchor) !== null;
}

/**
 * An ordered run of at most three marks over one live screen (search → confirm → next). Which
 * marks run, and how they are numbered, is `useCoachRun`'s.
 */
export function CoachMarkSequence({
  steps,
  words,
  open = true,
  within,
  onDismiss,
  onFinish,
  focusAfter,
  autoFocus = true,
}: CoachMarkSequenceProps) {
  const run = useCoachRun({ steps, words, open, onDismiss, onFinish }, isOnScreen);
  if (run === null) {
    return null;
  }
  return (
    <CoachMark
      {...run.current}
      key={run.index}
      within={run.current.within ?? within}
      {...run.mark}
      open
      autoFocus={autoFocus}
      onDismiss={onDismiss}
      focusAfter={focusAfter}
    />
  );
}
