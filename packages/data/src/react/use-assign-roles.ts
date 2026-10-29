'use client';
import {
  type AssignRolesOutcome,
  type AssignRolesRefusal,
  assignRolesOutcome,
  inMatrixOrder,
  lockedPresets,
  opensAssignRoles,
  type PresetLock,
  type RoleChange,
  type RolePreset,
  refusalAfterReread,
  roleChange,
  type SaveRolesOff,
  saveRolesOff,
  type TeamActAnswer,
  type TeamRow,
  type TransportFailure,
} from '@heliogrid/domain';
import { useCallback, useRef, useState } from 'react';
import { answerOf, DataError } from '../errors/errors';
import { useAction } from './action';
import { useAssignRolesDraft } from './assign-roles-draft';
import { useRepositories } from './context';
import { useSession } from './use-session';
import type { Team } from './use-team';

/** Assign Roles as both screens hold it (`SCR-M01-13`, Law 11): who is open, the ticks, the save. */
export interface AssignRolesEditor {
  readonly open: boolean;
  /**
   * The person last opened, as last read — kept while the editor closes, so it leaves with its own
   * words, locks and reason. Null before the first open.
   */
  readonly person: TeamRow | null;
  /** Every preset ticked now, in F2's order. */
  readonly picked: readonly RolePreset[];
  /** The held presets the sheet cannot clear, and why. */
  readonly locks: Partial<Record<RolePreset, PresetLock>>;
  /** Why *Save roles* is off, or null when it may run. */
  readonly saveOff: SaveRolesOff | null;
  readonly saving: boolean;
  /** Why the last save did not land (`m-error`); null while none has failed. */
  readonly refusal: AssignRolesRefusal | null;
  /** A save that takes presets away, waiting on its confirm (`m-confirm`); null while none asks. */
  readonly confirm: RoleChange | null;
  /** A row's open; undefined for a row Assign Roles does not open. */
  openerOf(row: TeamRow): (() => void) | undefined;
  pick(next: readonly RolePreset[]): void;
  /** Saves the ticks — or, when they take a preset away, asks first. */
  save(): void;
  /** The confirm's *Remove role*: the asked save goes. */
  removeConfirmed(): void;
  /** The confirm's *Cancel*: back to the editor, the ticks kept. */
  cancelRemove(): void;
  close(): void;
  /**
   * Closes the editor and keeps who it was open for and the ticks, so the screen can leave for the
   * Roles reference (`SCR-M01-14`) — a page of its own — and come back to them. Nothing to keep
   * while it is closed.
   */
  stepAside(): void;
  /**
   * Opens the editor again from the ticks `stepAside` kept, once the list is read, for a person it
   * still opens — and forgets them either way. Each screen calls it when Team shows again.
   */
  resume(): void;
}

/** What a removal tells the screen, which words it and raises its toasts. */
export interface RolesRemovalNotes {
  /** A save that took presets away landed; `undo` writes the old set back, once. */
  onRemoved(removal: RolesRemoval, undo: () => void): void;
  /** An undo did not land, and why (`m-error`'s words). */
  onUndoFailed(refusal: AssignRolesRefusal, removal: RolesRemoval): void;
}

/** A save that took presets away and landed — what its toast names and its *Undo* writes back. */
export interface RolesRemoval {
  readonly name: string;
  readonly id: string;
  readonly before: readonly RolePreset[];
  readonly removed: readonly RolePreset[];
}

/** A save as it leaves: the sheet it is sent from, what a removal names, and the ticks. */
type SaveOut = { from: number; removal: RolesRemoval; ticks: readonly RolePreset[] };

/** What a write came back with: the server's answer, or why none came (`F8-36`). */
interface Sent {
  readonly answer: TeamActAnswer;
  readonly failure: TransportFailure | null;
}

/**
 * One person's presets at a time, from the row they were opened on. A save sends the whole set
 * once per tap; the server decides it (`T-FPLAT-003`) and `assignRolesOutcome` says what its answer
 * means. Every answer lands only on the sheet it was sent from.
 */
export function useAssignRoles(team: Team, notes: RolesRemovalNotes): AssignRolesEditor {
  const repositories = useRepositories();
  const { rereadUser } = useSession();
  const [person, setPerson] = useState<TeamRow | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<readonly RolePreset[]>([]);
  const [refusal, setRefusal] = useState<AssignRolesRefusal | null>(null);
  const [confirm, setConfirm] = useState<RoleChange | null>(null);
  /* One undo per removal: a second tap, or the toast and a retry racing, writes nothing more. */
  const undone = useRef(new WeakSet<RolesRemoval>());
  /* Each open is a sheet of its own, numbered, so an answer sent from one sheet changes nothing on
     another — even the same person's, closed and opened again while the answer was out. */
  const [sheet, setSheet] = useState(0);
  const sheets = useRef(0);
  /* The person whose sheet is open now, so an undo that lands can bring it level with the server. */
  const openPerson = useRef<string | null>(null);
  /* The sheet open now, null while none is. */
  const openSheet = useRef<number | null>(null);

  /* Stable: the overlay re-runs its focus effect whenever its close handler changes. */
  const close = useCallback(() => {
    openSheet.current = null;
    openPerson.current = null;
    setOpen(false);
  }, []);

  const write = async (id: string, roles: readonly RolePreset[]): Promise<Sent> => {
    try {
      await repositories.tenant.assignRoles(id, [...roles]);
      return { answer: { status: 200, code: '' }, failure: null };
    } catch (error) {
      return {
        answer: answerOf(error),
        failure: error instanceof DataError ? error.failure : null,
      };
    }
  };

  /* A landed save that took presets away hands its removal on, for the toast and its undo. */
  const announce = (removal: RolesRemoval) => {
    if (removal.removed.length > 0) notes.onRemoved(removal, () => void undo(removal));
  };

  /* The sheet closes as the answer leaves it: saved, or the reader no longer manages the team. */
  const leave = async (
    from: number,
    outcome: 'done' | 'forbidden',
    removal: RolesRemoval,
    ticks: readonly RolePreset[],
  ) => {
    if (openSheet.current === from) close();
    if (outcome === 'forbidden') return rereadUser();
    team.holds(removal.id, ticks);
    announce(removal);
    await team.reread();
  };

  /* An answer that says nothing for certain: read the person again before the sheet says a word. */
  const readBack = async (
    from: number,
    removal: RolesRemoval,
    ticks: readonly RolePreset[],
    outcome: Exclude<AssignRolesOutcome, 'done' | 'forbidden' | 'failed'>,
    failure: TransportFailure | null,
  ) => {
    const roster = await team.reread();
    const refused = refusalAfterReread(outcome, roster, { id: removal.id, ticks }, failure);
    /* A save that landed keeps its way back, even when its sheet was closed while it was out. */
    if (refused === null) announce(removal);
    if (openSheet.current !== from) return;
    const fresh = roster?.find((row) => row.id === removal.id);
    if (fresh !== undefined) setPerson(fresh);
    if (refused === null) close();
    else setRefusal(refused);
  };

  const settle = async (
    from: number,
    removal: RolesRemoval,
    ticks: readonly RolePreset[],
    sent: Sent,
  ) => {
    const outcome = assignRolesOutcome(sent.answer);
    if (outcome === 'done' || outcome === 'forbidden') return leave(from, outcome, removal, ticks);
    if (outcome !== 'failed') return readBack(from, removal, ticks, outcome, sent.failure);
    if (openSheet.current === from) setRefusal({ kind: 'failed' });
  };

  /* One write per tap on a sheet, and that sheet's button alone shows it is out. */
  const saved = useAction(
    async ({ from, removal, ticks }: SaveOut) =>
      settle(from, removal, ticks, await write(removal.id, ticks)),
    { key: ({ from }) => String(from) },
  );
  const savingOn = (on: number | null) => on !== null && saved.pendingFor(String(on));

  const send = (asked: RoleChange | null) => {
    /* A tap while the editor closes saves nothing: it is still drawn, but it was dismissed. */
    const from = openSheet.current;
    if (person === null || from === null || savingOn(from)) return;
    if (saveRolesOff(person, picked, refusal) !== null) return;
    const change = asked ?? roleChange(person.roles, picked);
    if (asked === null && change.removed.length > 0) {
      setConfirm(change);
      return;
    }
    const { name, id, roles: before } = person;
    setRefusal(null);
    void saved.run({ from, removal: { name, id, before, removed: change.removed }, ticks: picked });
  };

  const removeConfirmed = () => {
    const asked = confirm;
    setConfirm(null);
    if (asked !== null) send(asked);
  };

  /* Why the undo did not land, or null when it did — or when the reader no longer manages the team
     and the screen leaves. */
  const writeBack = async (removal: RolesRemoval): Promise<AssignRolesRefusal | null> => {
    const sent = await write(removal.id, removal.before);
    const outcome = assignRolesOutcome(sent.answer);
    if (outcome === 'done') {
      team.holds(removal.id, removal.before);
      catchUp(removal.id, await team.reread());
      return null;
    }
    if (outcome === 'forbidden') {
      await rereadUser();
      return null;
    }
    if (outcome === 'failed') return { kind: 'failed' };
    const roster = await team.reread();
    const refused = refusalAfterReread(
      outcome,
      roster,
      { id: removal.id, ticks: removal.before },
      sent.failure,
    );
    if (refused === null) catchUp(removal.id, roster);
    return refused;
  };

  /* The person's sheet, open while an undo landed, takes the server's set: a save from stale ticks
     would quietly take the restored presets away again. */
  const catchUp = (id: string, roster: readonly TeamRow[] | null) => {
    const fresh = roster?.find((row) => row.id === id);
    if (fresh === undefined || openPerson.current !== id) return;
    setPerson(fresh);
    setPicked(fresh.roles);
    setConfirm(null);
  };

  const draft = useAssignRolesDraft(
    team,
    { open, person, picked, saving: savingOn(sheet) },
    { close, openOn },
  );

  function openOn(row: TeamRow, ticks: readonly RolePreset[]) {
    sheets.current += 1;
    openSheet.current = sheets.current;
    openPerson.current = row.id;
    setSheet(sheets.current);
    setPerson(row);
    setPicked(ticks);
    setRefusal(null);
    setConfirm(null);
    setOpen(true);
  }

  async function undo(removal: RolesRemoval) {
    if (undone.current.has(removal)) return;
    undone.current.add(removal);
    const refused = await writeBack(removal);
    if (refused !== null) notes.onUndoFailed(refused, removal);
  }

  return {
    open,
    person,
    picked,
    locks: person === null ? {} : lockedPresets(person, team.roster),
    saveOff: person === null ? null : saveRolesOff(person, picked, refusal),
    saving: savingOn(sheet),
    refusal,
    confirm,
    openerOf: (row) => (opensAssignRoles(row) ? () => openOn(row, row.roles) : undefined),
    pick: (next) => setPicked(inMatrixOrder(next)),
    save: () => send(null),
    removeConfirmed,
    cancelRemove: () => setConfirm(null),
    close,
    ...draft,
  };
}
