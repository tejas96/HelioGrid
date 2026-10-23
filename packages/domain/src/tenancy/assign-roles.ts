import { keepsControl } from '../authz/administration';
import { isCovered } from '../authz/grant-line';
import { can } from '../authz/policy';
import { inMatrixOrder, type RolePreset } from '../authz/roles';
import type { TeamRow } from './team-roster';

/**
 * What Assign Roles decides (`SCR-M01-13`, `M01-20`), once for both platforms (Law 11): which
 * rows open it, which presets a sheet cannot clear, and what a save changes. The server decides
 * every write; these only read.
 */

/** Only an active member has presets to assign: an invite or a deactivated person has none. */
export function opensAssignRoles(row: TeamRow): boolean {
  return row.status === 'active';
}

/**
 * Why a held preset's row is off: the company's last EPC Owner (F2-19), or the viewer's own
 * admin rights, which only another EPC Owner may take (F2-19).
 */
export type PresetLock = 'sole-owner' | 'own-admin';

/**
 * The held presets this person's sheet cannot clear, and why. `roster` is the WHOLE list, never
 * the rows a search left in view. When both reasons hold, the sole-owner one is shown.
 */
export function lockedPresets(
  person: TeamRow,
  roster: readonly TeamRow[],
): Partial<Record<RolePreset, PresetLock>> {
  const heldByOthers = roster
    .filter((other) => other.status === 'active' && other.id !== person.id)
    .flatMap((other) => other.roles);
  const locks: Partial<Record<RolePreset, PresetLock>> = {};
  for (const preset of person.roles) {
    const without = person.roles.filter((held) => held !== preset);
    if (!keepsControl([...heldByOthers, ...without])) locks[preset] = 'sole-owner';
    else if (person.isViewer && !can(without, 'onboarding.manage_team'))
      locks[preset] = 'own-admin';
  }
  return locks;
}

export interface RoleChange {
  readonly added: readonly RolePreset[];
  readonly removed: readonly RolePreset[];
  /** The removed presets the kept ones, together, do not cover — what the person can no longer do. */
  readonly lost: readonly RolePreset[];
}

/** Each in F2's order. A save that removes nothing asks nothing (`SCR-M01-13` brief). */
export function roleChange(
  before: readonly RolePreset[],
  after: readonly RolePreset[],
): RoleChange {
  const added = inMatrixOrder(after).filter((preset) => !before.includes(preset));
  const removed = inMatrixOrder(before).filter((preset) => !after.includes(preset));
  const lost = removed.filter((preset) => !isCovered(preset, after));
  return { added, removed, lost };
}

/** Why *Save roles* is off: nothing changed, or nothing is ticked (F2-21); null when it may run. */
export type SaveRolesOff = 'unchanged' | 'empty';

export function saveRolesOff(
  before: readonly RolePreset[],
  after: readonly RolePreset[],
): SaveRolesOff | null {
  if (after.length === 0) return 'empty';
  const { added, removed } = roleChange(before, after);
  return added.length === 0 && removed.length === 0 ? 'unchanged' : null;
}
