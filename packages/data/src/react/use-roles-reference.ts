'use client';
import {
  type RoleHolding,
  type RolePreset,
  roleHolders,
  type TeamLoad,
  type UiLanguage,
} from '@heliogrid/domain';
import { useMemo } from 'react';
import { useTeam } from './use-team';

/** The Roles reference's one read (`SCR-M01-14`): the Team roster, folded into each preset's holders. */
export interface RolesReference {
  readonly load: TeamLoad;
  /** Each preset's holders once the roster is read; null while it is out or after it failed. */
  readonly holdings: Readonly<Record<RolePreset, RoleHolding>> | null;
  /** Reads the roster again (the banner's *Try again*). */
  retry(): void;
}

export function useRolesReference(language: UiLanguage): RolesReference {
  const team = useTeam(language);
  const ready = team.load === 'ready';
  const holdings = useMemo(() => (ready ? roleHolders(team.roster) : null), [ready, team.roster]);
  return { load: team.load, holdings, retry: team.retry };
}
