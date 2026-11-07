'use client';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useGuardedMove } from './leave-guard';

interface Move {
  readonly from: string;
  readonly to: string;
}

interface MoveState {
  readonly move: Move | null;
  readonly setMove: (move: Move) => void;
}

const MoveContext = createContext<MoveState | null>(null);

/**
 * Holds the address a press is on its way to, so the sidebar and the settings side list light the
 * pressed item at once instead of when the next page arrives. Mounted once by the shell.
 */
export function InstantMoveProvider({ children }: { children: ReactNode }) {
  const [move, setMove] = useState<Move | null>(null);
  const pathname = usePathname();
  /* A move ends the moment the address leaves where it started: kept, Back to that address would
     still light the page it went to. */
  useEffect(() => {
    if (move !== null && pathname !== move.from) setMove(null);
  }, [pathname, move]);
  return <MoveContext.Provider value={{ move, setMove }}>{children}</MoveContext.Provider>;
}

/**
 * The address the navigation shows as in view: the one a press is moving to until the page there
 * arrives, else the page's own. A move from an older address is over, so it no longer counts.
 */
export function useShownPath(): string {
  const pathname = usePathname();
  const move = useContext(MoveContext)?.move ?? null;
  return move !== null && move.from === pathname ? move.to : pathname;
}

/**
 * An in-app move: asks first while a page holds a change (`useGuardedMove`), then lights its
 * target at once and goes there. `before` runs only when the move goes ahead.
 */
export function useInstantMove(): (to: string, before?: () => void) => void {
  const router = useRouter();
  const pathname = usePathname();
  const guarded = useGuardedMove();
  const setMove = useContext(MoveContext)?.setMove;
  return (to, before) =>
    guarded(() => {
      before?.();
      setMove?.({ from: pathname, to });
      router.push(to);
    });
}

/**
 * Loads each address's page ahead of a press, so a move shows its page at once. `paths` is read
 * by value: a new array with the same addresses fetches nothing again.
 */
export function usePrefetch(paths: readonly string[]): void {
  const router = useRouter();
  const key = paths.join('\n');
  useEffect(() => {
    for (const path of key.split('\n')) if (path !== '') router.prefetch(path);
  }, [router, key]);
}
