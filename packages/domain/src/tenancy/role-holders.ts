import { ROLE_PRESETS, type RolePreset } from '../authz/roles';
import type { TeamRow } from './team-roster';

/** Who stands under a preset without being counted: an open invite, or a person let go. */
export interface UncountedHolder {
  /** The membership's id, or the invitation's — two people may share a name. */
  readonly id: string;
  readonly name: string;
  readonly status: 'invited' | 'deactivated';
}

/**
 * One preset on the Roles reference (`SCR-M01-14`, `M01-21`): how many active members hold it —
 * zero included — who they are, and who is named under it but not counted. An invite that ran out
 * holds nothing and is not named.
 */
export interface RoleHolding {
  readonly count: number;
  /** The active members' names, in the roster's order. */
  readonly holders: readonly string[];
  readonly others: readonly UncountedHolder[];
}

/** Every preset's holding, read off the Team roster (`teamRoster`), whose order it keeps. */
export function roleHolders(rows: readonly TeamRow[]): Readonly<Record<RolePreset, RoleHolding>> {
  const holding = (preset: RolePreset): RoleHolding => {
    const held = rows.filter((row) => row.roles.includes(preset));
    const holders = held.filter((row) => row.status === 'active').map((row) => row.name);
    const others = held.flatMap((row): UncountedHolder[] =>
      row.status === 'invited' || row.status === 'deactivated'
        ? [{ id: row.id, name: row.name, status: row.status }]
        : [],
    );
    return { count: holders.length, holders, others };
  };
  return Object.fromEntries(ROLE_PRESETS.map((preset) => [preset, holding(preset)])) as Record<
    RolePreset,
    RoleHolding
  >;
}
