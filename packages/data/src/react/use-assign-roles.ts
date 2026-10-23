'use client';
import {
  inMatrixOrder,
  lockedPresets,
  opensAssignRoles,
  type PresetLock,
  type RolePreset,
  type SaveRolesOff,
  saveRolesOff,
  type TeamRow,
} from '@heliogrid/domain';
import { useCallback, useRef, useState } from 'react';
import { useRepositories } from './context';
import type { Team } from './use-team';

/** Assign Roles as both screens hold it (`SCR-M01-13`, Law 11): who is open, the ticks, the save. */
export interface AssignRolesEditor {
  readonly open: boolean;
  /**
   * The person last opened — kept while the editor closes, so it leaves with its own words, locks
   * and reason. Null before the first open.
   */
  readonly person: TeamRow | null;
  /** Every preset ticked now, in F2's order. */
  readonly picked: readonly RolePreset[];
  /** The held presets the sheet cannot clear, and why. */
  readonly locks: Partial<Record<RolePreset, PresetLock>>;
  /** Why *Save roles* is off, or null when it may run. */
  readonly saveOff: SaveRolesOff | null;
  readonly saving: boolean;
  /** A row's open; undefined for a row Assign Roles does not open. */
  openerOf(row: TeamRow): (() => void) | undefined;
  pick(next: readonly RolePreset[]): void;
  save(): void;
  close(): void;
}

/**
 * One person's presets at a time, from the row they were opened on. A save sends the whole set
 * once per tap; the server decides it (`T-FPLAT-003`) and the list is read again after it.
 */
export function useAssignRoles(team: Team): AssignRolesEditor {
  const repositories = useRepositories();
  const [person, setPerson] = useState<TeamRow | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<readonly RolePreset[]>([]);
  const [saving, setSaving] = useState(false);
  /* One write per tap: a second press while the first is out sends nothing. */
  const inFlight = useRef(false);
  /* Whose editor is open now, so a save that lands after another person was opened closes nothing. */
  const openId = useRef<string | null>(null);

  /* Stable: the overlay re-runs its focus effect whenever its close handler changes. */
  const close = useCallback(() => {
    openId.current = null;
    setOpen(false);
  }, []);

  const save = () => {
    /* A tap while the editor closes saves nothing: it is still drawn, but it was dismissed. */
    if (person === null || openId.current === null || inFlight.current) return;
    if (saveRolesOff(person.roles, picked) !== null) return;
    const saved = person.id;
    inFlight.current = true;
    setSaving(true);
    void repositories.tenant
      .assignRoles(saved, [...picked])
      .then(async () => {
        if (openId.current === saved) close();
        await team.reread();
      })
      .catch(() => undefined)
      .finally(() => {
        inFlight.current = false;
        setSaving(false);
      });
  };

  return {
    open,
    person,
    picked,
    locks: person === null ? {} : lockedPresets(person, team.roster),
    saveOff: person === null ? null : saveRolesOff(person.roles, picked),
    saving,
    openerOf: (row) =>
      opensAssignRoles(row)
        ? () => {
            openId.current = row.id;
            setPerson(row);
            setPicked(row.roles);
            setOpen(true);
          }
        : undefined,
    pick: (next) => setPicked(inMatrixOrder(next)),
    save,
    close,
  };
}
