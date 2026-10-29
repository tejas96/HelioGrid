'use client';
import {
  type FormatPack,
  mapRead,
  noteLeavesRow,
  opensSettingsRow,
  type Read,
  showsListHead,
  type TeamActNote,
  type TeamList,
  type TeamRow,
  type UiLanguage,
} from '@heliogrid/domain';
import { useCallback, useRef, useState } from 'react';
import { type AssignRolesEditor, type RolesRemovalNotes, useAssignRoles } from './use-assign-roles';
import { type Invite, useInvite } from './use-invite';
import { useSession } from './use-session';
import { useShell } from './use-shell';
import { type Team, useTeam } from './use-team';
import { type TeamActs, useTeamActs } from './use-team-acts';

/**
 * What the Team page tells its screen, which words it — the toasts and where the keyboard goes. A
 * removal's `undo` (`onRemoved`) also gives the keyboard to the search (`onLeftRow`) once *Undo*
 * has left with its toast — unless Assign Roles is open, whose trapped panel keeps it.
 */
export interface TeamScreenNotes extends RolesRemovalNotes {
  /** A row act's answer — its toast, when it has one. */
  onActNote(note: TeamActNote): void;
  /** A row act or a removal's *Undo* left the row the keyboard was on: the search takes it. */
  onLeftRow(): void;
  /**
   * Invite Teammate shut. The phone's sheet returns no focus, so the phone gives it back here; the
   * web's overlay returns it itself.
   */
  onInviteShut?(): void;
}

/** Assign Roles over the Team page (`SCR-M01-13`): `useAssignRoles`' editor, and its rows' read. */
export interface TeamRolesEditor extends AssignRolesEditor {
  /**
   * The Team list's read carrying the sheet's rows in the reader's words: until the list has come,
   * the rows' own skeleton draws (`m-loading`).
   */
  rowsRead<Rows>(rows: Rows): Read<Rows>;
}

/** Invite Teammate over the Team page (`SCR-M01-07`, `T-M01-007`): its send and its open fact. */
export interface TeamInviteEditor {
  readonly send: Invite;
  readonly isOpen: boolean;
  /** Opens the editor; the screen empties its form first. */
  open(): void;
  /** Stable: an overlay re-runs its focus effect whenever its close handler changes. */
  close(): void;
  /** A 403 on the send: the editor shuts and the team is read again (AC-19). */
  forbidden(): Promise<void>;
  /**
   * The first invite ended the teaching state, and with it the act that opened the editor: once the
   * list draws *Invite teammate* again the screen focuses it, then calls `refocused`.
   */
  readonly refocus: boolean;
  refocused(): void;
}

/** The Team page (`SCR-M01-12`) as both screens draw it, assembled once (Law 11, `F7-30`). */
export interface TeamScreen {
  /** The reader's presets open the Team row (`F7-48`); the web answers anyone else with not found. */
  readonly allowed: boolean;
  readonly team: Team;
  /** The company's name; empty until the shell has read it. */
  readonly company: string;
  /** The list in view once it is read: its counts, and whether it teaches. */
  readonly list: TeamList | null;
  /** The search and the Status chips stand over the list. */
  readonly showsHead: boolean;
  /** The rows in view, as the table draws them with its own wait. */
  readonly rows: Read<readonly TeamRow[]>;
  readonly acts: TeamActs;
  readonly roles: TeamRolesEditor;
  /** A row's open — none before the company's name has come, as the sole-owner reason names it. */
  readonly openOf: AssignRolesEditor['openerOf'] | undefined;
  readonly invite: TeamInviteEditor;
}

/**
 * Fills `TeamScreen`. What only the screen's packages know is its input: the reader's language,
 * the market's pack (the invite's phone rule) and the notes the screen words.
 */
export function useTeamScreen(
  language: UiLanguage,
  pack: FormatPack,
  notes: TeamScreenNotes,
): TeamScreen {
  const { user } = useSession();
  const shell = useShell();
  const team = useTeam(language);
  const acts = useTeamActs(team, (note) => {
    notes.onActNote(note);
    if (noteLeavesRow(note)) notes.onLeftRow();
  });
  const roles = useTeamRoles(team, notes);
  const invite = useTeamInvite(team, pack, notes);
  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'team'),
    team,
    company: shell.companyName ?? '',
    list: team.read.kind === 'ready' ? team.read.value : null,
    showsHead: showsListHead(team.read),
    rows: mapRead(team.read, (shown) => shown.view.rows),
    acts,
    roles,
    openOf: shell.companyName === null ? undefined : roles.openerOf,
    invite,
  };
}

function useTeamRoles(team: Team, notes: TeamScreenNotes): TeamRolesEditor {
  const open = useRef(false);
  const editor = useAssignRoles(team, {
    onRemoved: (removal, undo) =>
      notes.onRemoved(removal, () => {
        undo();
        if (!open.current) notes.onLeftRow();
      }),
    onUndoFailed: (refusal, removal) => notes.onUndoFailed(refusal, removal),
  });
  open.current = editor.open;
  return { ...editor, rowsRead: (rows) => mapRead(team.read, () => rows) };
}

/** A sent invite shuts the editor and reads the list again; so does a 403. */
function useTeamInvite(team: Team, pack: FormatPack, notes: TeamScreenNotes): TeamInviteEditor {
  const [isOpen, setOpen] = useState(false);
  const [refocus, setRefocus] = useState(false);
  const shut = useRef(notes.onInviteShut);
  shut.current = notes.onInviteShut;
  const close = useCallback(() => {
    setOpen(false);
    shut.current?.();
  }, []);
  const send = useInvite(pack, async () => {
    close();
    await team.reread();
    setRefocus(true);
  });
  return {
    send,
    isOpen,
    open: () => setOpen(true),
    close,
    forbidden: async () => {
      close();
      await team.reread();
    },
    refocus,
    refocused: () => setRefocus(false),
  };
}
