'use client';
import { useState } from 'react';
import { useAction } from './action';
import { type Connection, useConnection } from './use-connection';
import { useUnreadCount } from './use-notification-centre';
import { useSession } from './use-session';
import { type Shell, useShell } from './use-shell';

/** An overlay the shell opens over the page in view. */
export interface ShellOverlay {
  readonly isOpen: boolean;
  open(): void;
  close(): void;
  /** Opens it, or closes it when open — the web's bell. Read from the last answer, never this render. */
  toggle(): void;
}

/**
 * The shell around every inside page (`SCR-SHELL-01`) as both platforms draw it, assembled once
 * (Law 11, `F7-30`): the shell's facts, the person, the connection, the bell and its centre
 * (`SCR-SHELL-03`), the grievance note (`F1-59`), the sign-out and the header's search.
 */
export interface ShellScreen {
  readonly shell: Shell;
  /** The signed-in person, whom the account menu names. */
  readonly personName: string;
  /** Offline, the shell shows the one no-connection screen instead of blocks that wait (`F8-36`). */
  readonly connection: Connection;
  /** The bell's count (`F6-17`); null while it is unknown. */
  readonly unread: number | null;
  /** The grievance contact's note, opened from the account menu and from Frame 8. */
  readonly grievance: ShellOverlay;
  /** The notification centre, opened by the bell over the page in view. */
  readonly centre: ShellOverlay;
  /** The empty centre's way to the leads shows only when this person's shell opens that door. */
  readonly offersLeads: boolean;
  /** A sign-out is out: Frame 8's act waits on it. */
  readonly signingOut: boolean;
  /** Signs out; a second press while one is out sends nothing. */
  signOut(): void;
  /** What is typed in the header's search field. Enter opens the search door; it searches nothing. */
  readonly searchQuery: string;
  typeSearch(query: string): void;
}

export function useShellScreen(): ShellScreen {
  const session = useSession();
  const shell = useShell();
  const connection = useConnection();
  const unread = useUnreadCount();
  const grievance = useOverlay();
  const centre = useOverlay();
  const leaving = useAction<void, void>(() => session.signOut());
  const [searchQuery, setSearchQuery] = useState('');
  return {
    shell,
    personName: session.user?.name ?? '',
    connection,
    unread,
    grievance,
    centre,
    offersLeads: shell.doors.includes('leads'),
    signingOut: leaving.pending,
    signOut: () => void leaving.run(),
    searchQuery,
    typeSearch: setSearchQuery,
  };
}

function useOverlay(): ShellOverlay {
  const [isOpen, setOpen] = useState(false);
  return {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((open) => !open),
  };
}
