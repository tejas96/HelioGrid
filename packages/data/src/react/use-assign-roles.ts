'use client';
import {
  type AssignRolesRefusal,
  assignRolesOutcome,
  inMatrixOrder,
  lockedPresets,
  opensAssignRoles,
  type PresetLock,
  type RolePreset,
  refusalAfterReread,
  type SaveRolesOff,
  saveRolesOff,
  type TeamActAnswer,
  type TeamRow,
  type TransportFailure,
} from '@heliogrid/domain';
import { useCallback, useRef, useState } from 'react';
import { answerOf, DataError } from '../errors/errors';
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
  /** A row's open; undefined for a row Assign Roles does not open. */
  openerOf(row: TeamRow): (() => void) | undefined;
  pick(next: readonly RolePreset[]): void;
  save(): void;
  close(): void;
}

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
export function useAssignRoles(team: Team): AssignRolesEditor {
  const repositories = useRepositories();
  const { rereadUser } = useSession();
  const [person, setPerson] = useState<TeamRow | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<readonly RolePreset[]>([]);
  const [refusal, setRefusal] = useState<AssignRolesRefusal | null>(null);
  /* Each open is a sheet of its own, numbered, so an answer sent from one sheet changes nothing on
     another — even the same person's, closed and opened again while the answer was out. */
  const [sheet, setSheet] = useState(0);
  const sheets = useRef(0);
  /* The sheet open now, null while none is. */
  const openSheet = useRef<number | null>(null);
  /* The sheet whose save is out: one write per tap on that sheet, and its button alone shows it. */
  const [savingOn, setSavingOn] = useState<number | null>(null);
  const inFlight = useRef<number | null>(null);

  /* Stable: the overlay re-runs its focus effect whenever its close handler changes. */
  const close = useCallback(() => {
    openSheet.current = null;
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

  /* The sheet closes as the answer leaves it: saved, or the reader no longer manages the team. */
  const leave = async (from: number, outcome: 'done' | 'forbidden') => {
    if (openSheet.current === from) close();
    if (outcome === 'done') await team.reread();
    else await rereadUser();
  };

  const settle = async (from: number, id: string, ticks: readonly RolePreset[], sent: Sent) => {
    const outcome = assignRolesOutcome(sent.answer);
    if (outcome === 'done' || outcome === 'forbidden') return leave(from, outcome);
    if (outcome === 'failed') {
      if (openSheet.current === from) setRefusal({ kind: 'failed' });
      return;
    }
    const roster = await team.reread();
    if (openSheet.current !== from) return;
    const fresh = roster?.find((row) => row.id === id);
    if (fresh !== undefined) setPerson(fresh);
    const refused = refusalAfterReread(outcome, roster, { id, ticks }, sent.failure);
    if (refused === null) close();
    else setRefusal(refused);
  };

  const save = () => {
    /* A tap while the editor closes saves nothing: it is still drawn, but it was dismissed. */
    const from = openSheet.current;
    if (person === null || from === null || inFlight.current === from) return;
    if (saveRolesOff(person, picked, refusal) !== null) return;
    const id = person.id;
    const ticks = picked;
    inFlight.current = from;
    setSavingOn(from);
    setRefusal(null);
    void write(id, ticks)
      .then((sent) => settle(from, id, ticks, sent))
      .finally(() => {
        if (inFlight.current === from) inFlight.current = null;
        setSavingOn((now) => (now === from ? null : now));
      });
  };

  return {
    open,
    person,
    picked,
    locks: person === null ? {} : lockedPresets(person, team.roster),
    saveOff: person === null ? null : saveRolesOff(person, picked, refusal),
    saving: savingOn !== null && savingOn === sheet,
    refusal,
    openerOf: (row) =>
      opensAssignRoles(row)
        ? () => {
            sheets.current += 1;
            openSheet.current = sheets.current;
            setSheet(sheets.current);
            setPerson(row);
            setPicked(row.roles);
            setRefusal(null);
            setOpen(true);
          }
        : undefined,
    pick: (next) => setPicked(inMatrixOrder(next)),
    save,
    close,
  };
}
