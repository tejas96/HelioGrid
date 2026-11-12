import { useEffect, useRef, useState } from 'react';
import { type FocusAfter, landFocusOn } from '../../primitives/FocusAfter';
import type { OwnerDashboardWords } from './OwnerDashboard.types';

/** What the inline target editor takes, on both halves. */
export interface TargetEditorProps {
  readonly words: OwnerDashboardWords;
  /** The target set now, as its decimal; `null` when none is. */
  readonly initial: string | null;
  readonly saving: boolean;
  readonly failed: boolean;
  /** The decimal typed, or `null` to clear the target. */
  readonly onSave: (amount: string | null) => void;
  readonly onCancel: () => void;
}

/** A typed decimal as the field's figure; `''` is unset, never `0`. */
export function figureOfDraft(draft: string): number | undefined {
  return draft === '' ? undefined : Number(draft);
}

/**
 * Whether the editor is open: it opens on *Set a target* or the pencil, and closes on *Cancel* or
 * once a save it sent comes back without failing — focus then lands on the card's figure.
 */
export function useTargetEditing(saving: boolean, failed: boolean, focusAfter: FocusAfter) {
  const [editing, setEditing] = useState(false);
  const wasSaving = useRef(saving);
  useEffect(() => {
    const finished = wasSaving.current && !saving;
    wasSaving.current = saving;
    if (finished && !failed && editing) {
      setEditing(false);
      landFocusOn(focusAfter);
    }
  }, [saving, failed, editing, focusAfter]);
  return { editing, open: () => setEditing(true), close: () => setEditing(false) };
}
