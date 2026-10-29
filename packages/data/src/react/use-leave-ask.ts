'use client';
import { useState } from 'react';

/**
 * The way out of a page that holds a change, asked first (`SCR-M01-18` s18-w, `SCR-M01-19`
 * m19-n10). The platform holds the move and hands it here — the web's in-app moves
 * (`useLeaveGuard`), the phone's way back and system Back (`usePreventRemove`) — and the move runs
 * only once the person chose to leave.
 */
export interface LeaveAsk {
  readonly asking: boolean;
  /** A move away was held: the ask opens, and the move waits for the answer. */
  ask(move: () => void): void;
  stay(): void;
  /** Drops the change, then makes the held move. */
  leave(): void;
}

/** `discard` drops the page's change; it runs only on *Leave*, before the held move. */
export function useLeaveAsk(discard: () => void): LeaveAsk {
  const [held, setHeld] = useState<(() => void) | null>(null);
  return {
    asking: held !== null,
    ask: (move) => setHeld(() => move),
    stay: () => setHeld(null),
    leave: () => {
      if (held === null) return;
      setHeld(null);
      discard();
      held();
    },
  };
}
