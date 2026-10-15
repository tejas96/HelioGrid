import {
  type RolePreset,
  type SettingsGroup,
  type SettingsListView,
  type SettingsRow,
  settingsRowsFor,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * The settings list behind `More` (`SCR-SHELL-01`, *More: the settings list*): the page's title,
 * each group's name in the person's words, and each row's name — its screen's register name,
 * shortened. Authored once for both platforms (Law 11) in three languages (`F3-07`). A screen that
 * lands reuses its row's word as its own title, so the row and the page never disagree.
 */
const SETTINGS = {
  /** The page's title: the bar reads `More`, the page it opens reads this (`SCR-M01-05`'s `Back to settings`). */
  title: /*i18n*/ { id: 'Settings' },
  /** A settings screen's way back to the list, on the phone's bar (`SCR-M01-05`, `m-settings`). */
  back: /*i18n*/ { id: 'Back to settings' },
} as const;

const GROUP_NAME: Record<SettingsGroup, { id: string }> = {
  you: /*i18n*/ { id: 'You' },
  team: /*i18n*/ { id: 'Your team' },
  company: /*i18n*/ { id: 'Your company' },
  catalog: /*i18n*/ { id: 'What you sell' },
  agent: /*i18n*/ { id: 'Customer calls' },
  money: /*i18n*/ { id: 'Money' },
};

const ROW_NAME: Record<SettingsRow, { id: string }> = {
  profile: /*i18n*/ { id: 'Profile & preferences' },
  team: /*i18n*/ { id: 'Team' },
  roles: /*i18n*/ { id: 'Roles reference' },
  company_profile: /*i18n*/ { id: 'Business profile' },
  branding: /*i18n*/ { id: 'Branding' },
  proposal_templates: /*i18n*/ { id: 'Proposal templates' },
  payment_terms: /*i18n*/ { id: 'Payment terms' },
  catalog: /*i18n*/ { id: 'Catalog' },
  agent: /*i18n*/ { id: 'Agent & voice' },
  collections: /*i18n*/ { id: 'Collections' },
  billing: /*i18n*/ { id: 'Billing' },
  usage: /*i18n*/ { id: 'Usage' },
};

/** Every word the settings list draws, in the reader's language. */
export interface SettingsWords {
  readonly title: string;
  readonly groups: Readonly<Record<SettingsGroup, string>>;
  readonly rows: Readonly<Record<SettingsRow, string>>;
}

export function settingsWords(translate: Translator['t']): SettingsWords {
  return {
    title: translate(SETTINGS.title),
    groups: {
      you: translate(GROUP_NAME.you),
      team: translate(GROUP_NAME.team),
      company: translate(GROUP_NAME.company),
      catalog: translate(GROUP_NAME.catalog),
      agent: translate(GROUP_NAME.agent),
      money: translate(GROUP_NAME.money),
    },
    rows: {
      profile: translate(ROW_NAME.profile),
      team: translate(ROW_NAME.team),
      roles: translate(ROW_NAME.roles),
      company_profile: translate(ROW_NAME.company_profile),
      branding: translate(ROW_NAME.branding),
      proposal_templates: translate(ROW_NAME.proposal_templates),
      payment_terms: translate(ROW_NAME.payment_terms),
      catalog: translate(ROW_NAME.catalog),
      agent: translate(ROW_NAME.agent),
      collections: translate(ROW_NAME.collections),
      billing: translate(ROW_NAME.billing),
      usage: translate(ROW_NAME.usage),
    },
  };
}

/** A settings screen's way back to the list — the name of its back control. */
export function backToSettings(translate: Translator['t']): string {
  return translate(SETTINGS.back);
}

/** One row's name — the title its screen takes when it lands. */
export function settingsRowName(translate: Translator['t'], row: SettingsRow): string {
  return translate(ROW_NAME[row]);
}

/**
 * The list for a person holding `roles`, worded: the groups and rows domain leaves them
 * (`settingsRowsFor`), each with its name. Both screens and the component page call this and
 * build nothing of their own (Law 11).
 */
export function settingsListFor(
  translate: Translator['t'],
  roles: readonly RolePreset[],
): SettingsListView {
  const words = settingsWords(translate);
  return {
    title: words.title,
    groups: settingsRowsFor(roles).map((group) => ({
      key: group.group,
      name: words.groups[group.group],
      rows: group.rows.map((row) => ({ key: row, name: words.rows[row] })),
    })),
  };
}
