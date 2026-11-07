import type { TranslatedText } from '@heliogrid/contracts';
import {
  type RolePreset,
  type SettingsGroup,
  type SettingsListView,
  type SettingsRow,
  type SettingsStanding,
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
  /** The line under the settings list's large title. */
  summary: /*i18n*/ { id: 'You, your team and your company, in one place.' },
  /** A settings screen's way back to the list, on the phone's bar (`SCR-M01-05`, `m-settings`). */
  back: /*i18n*/ { id: 'Back to settings' },
  /** The standing line under a settings page's title (`SCR-M01-18`, `SCR-M01-19`). */
  savedBy: /*i18n*/ { id: 'Saved and in force · {name}, {date}' },
  savedOn: /*i18n*/ { id: 'Saved and in force · {date}' },
  saved: /*i18n*/ { id: 'Saved and in force' },
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
  proposal_templates: /*i18n*/ { id: 'Proposal template' },
  payment_terms: /*i18n*/ { id: 'Payment terms' },
  catalog: /*i18n*/ { id: 'Catalog' },
  agent: /*i18n*/ { id: 'Agent & voice' },
  collections: /*i18n*/ { id: 'Collections' },
  billing: /*i18n*/ { id: 'Billing' },
  usage: /*i18n*/ { id: 'Usage' },
};

/** What each settings row is for, under its name, so a first-time owner knows where to go. */
const ROW_HINT: Record<SettingsRow, { id: string }> = {
  profile: /*i18n*/ { id: 'Your photo, language and theme' },
  team: /*i18n*/ { id: 'Who works here and what they can do' },
  roles: /*i18n*/ { id: 'What each role sees and does' },
  company_profile: /*i18n*/ { id: 'Address, tax number and bank' },
  branding: /*i18n*/ { id: 'Logo and colours on every proposal' },
  proposal_templates: /*i18n*/ { id: 'How your proposals read and look' },
  payment_terms: /*i18n*/ { id: 'The stages your customers pay in' },
  catalog: /*i18n*/ { id: 'Items and prices your proposals use' },
  agent: /*i18n*/ { id: 'The voice that calls your leads' },
  collections: /*i18n*/ { id: 'Payments due and received' },
  billing: /*i18n*/ { id: 'Your plan, invoices and payment method' },
  usage: /*i18n*/ { id: 'What this cycle has used' },
};

/** Every word the settings list draws, in the reader's language. */
export interface SettingsWords {
  readonly title: TranslatedText;
  readonly summary: TranslatedText;
  readonly hints: Readonly<Record<SettingsRow, TranslatedText>>;
  readonly groups: Readonly<Record<SettingsGroup, TranslatedText>>;
  readonly rows: Readonly<Record<SettingsRow, TranslatedText>>;
}

export function settingsWords(translate: Translator['t']): SettingsWords {
  return {
    title: translate(SETTINGS.title),
    summary: translate(SETTINGS.summary),
    hints: {
      profile: translate(ROW_HINT.profile),
      team: translate(ROW_HINT.team),
      roles: translate(ROW_HINT.roles),
      company_profile: translate(ROW_HINT.company_profile),
      branding: translate(ROW_HINT.branding),
      proposal_templates: translate(ROW_HINT.proposal_templates),
      payment_terms: translate(ROW_HINT.payment_terms),
      catalog: translate(ROW_HINT.catalog),
      agent: translate(ROW_HINT.agent),
      collections: translate(ROW_HINT.collections),
      billing: translate(ROW_HINT.billing),
      usage: translate(ROW_HINT.usage),
    },
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
export function backToSettings(translate: Translator['t']): TranslatedText {
  return translate(SETTINGS.back);
}

/** One row's name — the title its screen takes when it lands. */
export function settingsRowName(translate: Translator['t'], row: SettingsRow): TranslatedText {
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
): SettingsListView<TranslatedText> {
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

/** The toast that answers a settings save as it lands, with the `saved` moment. */
export function settingsSavedToast(translate: Translator['t']): TranslatedText {
  return translate(SETTINGS.saved);
}

/**
 * The standing line for a save the page knows of; `null` while nothing was ever saved, which each
 * page words its own way (Branding names the platform's defaults, the Proposal template draws none).
 */
export function settingsSavedLine(
  translate: Translator['t'],
  standing: SettingsStanding,
  formats: { readonly date: (epochMs: number) => string },
): TranslatedText | null {
  if (standing.kind === 'never-set') return null;
  if (standing.kind === 'saved-unknown') return translate(SETTINGS.saved);
  const date = formats.date(standing.at);
  return standing.name === null || standing.name === ''
    ? translate(SETTINGS.savedOn, { date })
    : translate(SETTINGS.savedBy, { name: standing.name, date });
}
