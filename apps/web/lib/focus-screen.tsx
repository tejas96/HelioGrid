'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { InstantMoveProvider } from './instant-move';
import { LeaveGuardProvider } from './leave-guard';

/**
 * The inside pages that are FOCUS screens (`T-M06-002`, `T-M01-030`, the studio's `T-M05-002a`): one job, drawn with no
 * sidebar, no settings side list and no bottom pill. A page joins by its path pattern here — a
 * `[segment]` matches any one segment — and nowhere else: the inside layout and the settings
 * layout both ask `useIsFocusScreen`.
 */
const FOCUS_PATHS = [
  '/designs/[id]',
  '/proposals/[id]/build',
  '/proposals/[id]/document',
  '/more/proposal-templates',
];

function matches(pattern: string, path: string): boolean {
  const wanted = pattern.split('/');
  const given = path.replace(/\/+$/, '').split('/');
  return (
    wanted.length === given.length &&
    wanted.every((part, at) => (part.startsWith('[') ? given[at] !== '' : part === given[at]))
  );
}

/** Whether the page in view is a focus screen. */
export function useIsFocusScreen(): boolean {
  const path = usePathname();
  return FOCUS_PATHS.some((pattern) => matches(pattern, path));
}

/**
 * The inside layout's one choice: a focus screen is drawn alone — still inside the leave guard and
 * the instant move the shell gives every page — and every other page inside `shell`.
 */
export function FocusOrShell({ shell, children }: { shell: ReactNode; children: ReactNode }) {
  const focus = useIsFocusScreen();
  if (!focus) return shell;
  return (
    <LeaveGuardProvider>
      <InstantMoveProvider>{children}</InstantMoveProvider>
    </LeaveGuardProvider>
  );
}
