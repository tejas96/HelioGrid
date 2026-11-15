import { useEffect, useRef } from 'react';

/**
 * A field that commits when it is left also commits when it leaves the page while still in use.
 * On touch a press never takes focus from the field first, so a Next, Back or ✕ that unmounts the
 * field before it blurs would drop the typed value with no ask (`packages/ui/CLAUDE.md` Traps).
 * `inUse` is read as of the last render: focused, or holding an edit not yet committed.
 */
export function useCommitOnUnmount(inUse: boolean, commit: () => void): void {
  const latest = useRef({ inUse, commit });
  latest.current = { inUse, commit };
  useEffect(
    () => () => {
      if (latest.current.inUse) latest.current.commit();
    },
    [],
  );
}
