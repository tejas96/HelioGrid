import { useState } from 'react';

/**
 * The action is taken once: after the first press it is off, so a double press signs out once
 * — two presses posted two sign-outs, and the session store has no in-flight guard.
 */
export function useAccessRemoved(onAction: () => void): { busy: boolean; act: () => void } {
  const [busy, setBusy] = useState(false);
  const act = () => {
    if (busy) return;
    setBusy(true);
    onAction();
  };
  return { busy, act };
}
