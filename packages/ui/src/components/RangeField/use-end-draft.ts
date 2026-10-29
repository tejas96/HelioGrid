import { useEffect, useState } from 'react';
import { commitEnd } from './RangeField.logic';
import type { RangeEndBoxProps } from './RangeField.types';

/**
 * One end's draft, committed once: while the box is not focused it follows `value`; a commit snaps
 * the draft to the step inside the end's window and reports only a changed value, and an empty or
 * garbage draft restores the last good one.
 */
export function useEndDraft({
  value,
  min,
  max,
  step,
  onCommit,
}: Pick<RangeEndBoxProps, 'value' | 'min' | 'max' | 'step' | 'onCommit'>) {
  const [draft, setDraft] = useState(String(value));
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    if (!focus) setDraft(String(value));
  }, [value, focus]);

  const commit = () => {
    const next = commitEnd(draft, min, max, step);
    if (next === null) {
      setDraft(String(value));
      return;
    }
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return { draft, setDraft, focus, setFocus, commit };
}
