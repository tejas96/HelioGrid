import { useState } from 'react';

/**
 * A sheet's own copy of what it edits, so its *Done* can sit in the sheet's foot outside the form:
 * taken from `value` each time the sheet opens (or when the value arrives while it is open), held
 * while the person types, and nothing leaves the sheet until *Done*. A parent that redraws while
 * the sheet is open never resets what was typed.
 */
export function useSheetDraft<T>(open: boolean, value: T | null) {
  const [held, setHeld] = useState<{ open: boolean; draft: T | null }>({
    open,
    draft: open ? value : null,
  });
  const stale = held.open !== open || (open && held.draft === null && value !== null);
  if (stale) setHeld({ open, draft: open ? value : null });
  const draft = stale ? (open ? value : null) : held.draft;
  return [draft, (next: T) => setHeld({ open: true, draft: next })] as const;
}
