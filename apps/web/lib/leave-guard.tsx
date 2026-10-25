'use client';
import { createContext, type ReactNode, useContext, useEffect, useRef } from 'react';

/** Asks before a move away; calls `leave` only once the person chose to go. */
type Ask = (leave: () => void) => void;

interface LeaveGuardHolder {
  current: Ask | null;
}

const LeaveGuardContext = createContext<LeaveGuardHolder | null>(null);

/**
 * The one place a page with an unsaved change is asked about before an in-app move: the shell's
 * rail, its search and the settings side list go through `useGuardedMove` (`SCR-M01-18`, D1 A).
 * Mounted once by the shell around every inside page.
 */
export function LeaveGuardProvider({ children }: { children: ReactNode }) {
  const holder = useRef<Ask | null>(null);
  return <LeaveGuardContext.Provider value={holder}>{children}</LeaveGuardContext.Provider>;
}

/**
 * A move that asks first while a page holds a change: `move` runs at once when nothing is held.
 * Outside the shell (no provider) it moves at once.
 */
export function useGuardedMove(): (move: () => void) => void {
  const holder = useContext(LeaveGuardContext);
  return (move) => {
    const ask = holder?.current ?? null;
    if (ask === null) move();
    else ask(move);
  };
}

/**
 * A page holding a change: while `held`, an in-app move asks through `ask`, and closing or reloading
 * the tab gets the browser's own prompt. The browser's Back leaves without asking — Next's router
 * gives no safe hold on it (owner ruling D1 A).
 */
export function useLeaveGuard(held: boolean, ask: Ask): void {
  const holder = useContext(LeaveGuardContext);
  const latest = useRef(ask);
  latest.current = ask;
  useEffect(() => {
    if (!held || holder === null) return;
    const asking: Ask = (leave) => latest.current(leave);
    holder.current = asking;
    const prompt = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', prompt);
    return () => {
      if (holder.current === asking) holder.current = null;
      window.removeEventListener('beforeunload', prompt);
    };
  }, [held, holder]);
}
