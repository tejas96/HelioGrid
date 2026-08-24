import { useCallback, useState } from 'react';
import type { CoachMarksOptions, CoachMarksState } from './CoachMark.types';

/**
 * Per-screen first-run state, the native half.
 *
 * PERSISTENCE IS THE CALLER'S ON NATIVE. The web half writes `hg.coachmark.<id>` to localStorage;
 * RN has no synchronous key-value store in the platform, and `@heliogrid/ui` takes no storage
 * dependency and holds no app state (docs/engineering/17 §8). So this half is SESSION-SCOPED: dismissal holds
 * for as long as the app is running, and a screen that needs "shown once, ever" drives `open`
 * itself from whatever store the app already has. `replay()` is unchanged — Help still brings the
 * sequence back.
 */
export function useCoachMarks(
  _id: string,
  { enabled = true }: CoachMarksOptions = {},
): CoachMarksState {
  const [seen, setSeen] = useState(false);
  const [open, setOpen] = useState(enabled);

  const dismiss = useCallback(() => {
    setSeen(true);
    setOpen(false);
  }, []);

  const replay = useCallback(() => setOpen(true), []);

  return { open: open && enabled, seen, dismiss, replay };
}
