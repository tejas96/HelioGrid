'use client';
import {
  mapRead,
  opensSettingsRow,
  type Read,
  type RoleHolding,
  type RolePreset,
  roleHolders,
  type UiLanguage,
} from '@heliogrid/domain';
import { useMemo } from 'react';
import { useSession } from './use-session';
import { useTeam } from './use-team';

type Holdings = Readonly<Record<RolePreset, RoleHolding>>;

/** The Roles reference's one read (`SCR-M01-14`): the Team roster, folded into each preset's holders. */
export interface RolesReference {
  /** This person's presets open the row (`F7-48`); a screen reached by a link answers false as not found. */
  readonly allowed: boolean;
  /** The roster's read, as each preset's holders; its failed retry is the banner's *Try again*. */
  readonly read: Read<Holdings>;
  /** The read's holders once it is ready; null while it is out or after it failed. */
  readonly holdings: Holdings | null;
}

export function useRolesReference(language: UiLanguage): RolesReference {
  const { user } = useSession();
  const team = useTeam(language);
  const holders = useMemo(() => roleHolders(team.roster), [team.roster]);
  const read = mapRead(team.read, () => holders);
  return {
    allowed: opensSettingsRow(user?.tenant?.roles ?? [], 'roles'),
    read,
    holdings: read.kind === 'ready' ? read.value : null,
  };
}
