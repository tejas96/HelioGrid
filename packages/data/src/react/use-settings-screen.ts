'use client';
import {
  firstSettingsPageBeside,
  opensSettingsRow,
  type RolePreset,
  type SettingsRow,
  settingsRowOfSegment,
} from '@heliogrid/domain';
import { useSession } from './use-session';

/**
 * The settings list behind `More` and the rows it opens (`SCR-SHELL-01`, *More: the settings
 * list*), as both platforms draw them, assembled once (Law 11, `F7-30`). The list's words are
 * `settingsListFor`'s, from `roles`.
 */
export interface SettingsScreen {
  /** The signed-in person, whom the list is headed with. */
  readonly personName: string;
  /** The presets held: the list holds the rows they open. */
  readonly roles: readonly RolePreset[];
  /**
   * The page the list opens first when it stands beside settings pages at the shell's desktop
   * width; null when it has nothing to move between, and so stays a list page with no side list.
   */
  readonly firstBeside: SettingsRow | null;
  /**
   * The row an address's segment names when this person's presets open it; null for any other
   * address, which is not found (`F7-48`).
   */
  openedRow(segment: string): SettingsRow | null;
}

export function useSettingsScreen(): SettingsScreen {
  const { user } = useSession();
  const roles = user?.tenant?.roles ?? [];
  return {
    personName: user?.name ?? '',
    roles,
    firstBeside: firstSettingsPageBeside(roles),
    openedRow: (segment) => {
      const row = settingsRowOfSegment(segment);
      return row !== null && opensSettingsRow(roles, row) ? row : null;
    },
  };
}
