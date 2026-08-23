import { useCallback, useEffect, useState } from 'react';
import type { CoachMarksOptions, CoachMarksState } from './CoachMark.types';
import { coachMarkKey } from './CoachMark.types';

/**
 * Per-screen first-run state. `open` is false once dismissed, on every later visit.
 *
 * DISMISSAL IS FOREVER BY DESIGN ("shown once"), which is exactly why `replay` exists: Help must be
 * able to bring the sequence back, or a first-run-only component strands anyone who dismissed it on
 * day one. This only ever writes its own key.
 */
export function useCoachMarks(
  id: string,
  { enabled = true }: CoachMarksOptions = {},
): CoachMarksState {
  const key = coachMarkKey(id);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(key);
    } catch {
      /* private mode: show once per session rather than not at all */
    }
    setSeen(stored !== null);
    setOpen(enabled && stored === null);
  }, [key, enabled]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(key, new Date().toISOString());
    } catch {
      /* private mode: the dismissal holds for this session */
    }
    setSeen(true);
    setOpen(false);
  }, [key]);

  const replay = useCallback(() => setOpen(true), []);

  return { open, seen, dismiss, replay };
}
