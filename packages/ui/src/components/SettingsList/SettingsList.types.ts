import type { SettingsListGroup, SettingsRow } from '@heliogrid/domain';

/** The signed-in person, as the first tile draws them: the name over their own settings row. */
export interface SettingsListPerson {
  name: string;
  /** A picture when the account holds one; initials otherwise. */
  picture?: string;
}

/**
 * The settings list behind `More` (`SCR-SHELL-01`, *More: the settings list*): the page's title;
 * the person's tile — the avatar in a brand ring over the bloom, the name, and their own settings
 * row, one control; then each other group as an overline heading on the page over ONE grey tile
 * holding its rows, each row an icon circle, the name and a chevron, nothing else (`M01-29`).
 * Functional density (`F7-17`). Which rows a person sees is domain's (`settingsRowsFor`, as
 * `SettingsListView`); every word is i18n's; this draws. At the shell's desktop width the groups
 * sit in three columns, by what is decided together (`SettingsList.logic.ts`).
 */
export interface SettingsListProps {
  title: string;
  person: SettingsListPerson;
  groups: readonly SettingsListGroup[];
  /** A row pressed: the app routes to its screen. */
  onOpen: (row: SettingsRow) => void;
}
