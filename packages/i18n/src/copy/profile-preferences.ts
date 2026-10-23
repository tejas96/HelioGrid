/**
 * The words of Profile & preferences (`SCR-M01-11`), for the view domain's
 * `profilePreferencesView` decides — authored once for both platforms (Law 11). Each language is
 * named in its own script by `LANGUAGE_META`, never here (`F3-03`); the market's name is the pack's.
 */

import {
  type FormatPack,
  type NotificationTypeGroup,
  type PreferenceSource,
  type ProfilePreference,
  type ProfilePreferencesView,
  packLabel,
  type RolePreset,
  type UiLanguage,
} from '@heliogrid/domain';
import { languageOptions } from '../languages';
import type { Translator } from '../runtime';
import { TYPE_GROUP_NAME } from './notifications';
import { settingsRowName } from './settings';
import { presetName } from './shell';
import { SIGN_IN } from './sign-in';

export const PROFILE_PREFERENCES = {
  account: /*i18n*/ { id: 'Your account' },
  editName: /*i18n*/ { id: 'Edit name' },
  languageAndUnits: /*i18n*/ { id: 'Language and units' },
  yourRole: /*i18n*/ { id: 'Your role' },
  yourRoles: /*i18n*/ { id: 'Your roles' },
  language: /*i18n*/ { id: 'Language' },
  measurements: /*i18n*/ { id: 'Measurements' },
  metres: /*i18n*/ { id: 'Metres' },
  feet: /*i18n*/ { id: 'Feet' },
  deviceLanguage: /*i18n*/ { id: "Your device's language" },
  marketDefault: /*i18n*/ { id: 'Default for {market}' },
  yourChoice: /*i18n*/ { id: 'Your choice' },
  notSaved: /*i18n*/ { id: 'Not saved. Try again.' },
  push: /*i18n*/ { id: 'Push notifications' },
  aboutPush: /*i18n*/ { id: 'About push' },
  aboutPushLine: /*i18n*/ {
    id: 'Turn a group off to stop its push. Every notification still arrives in HelioGrid — Notifications keeps the record either way.',
  },
  whyBilling: /*i18n*/ { id: 'Why Billing stays on' },
  whyBillingLine: /*i18n*/ {
    id: 'Always sent, and it cannot be muted: billing events are audit-relevant for the owner account.',
  },
  loading: /*i18n*/ { id: 'Loading your preferences' },
  loadFailed: /*i18n*/ { id: "Your preferences didn't load" },
  nothingChanged: /*i18n*/ { id: 'Nothing you saved has changed.' },
};

/** What the words are about, beside the view: the reader's language, the market, a refused save. */
export interface ProfilePreferencesWordFacts {
  readonly reader: UiLanguage;
  readonly pack: FormatPack;
  readonly refused: readonly ProfilePreference[];
}

/** One role as its badge reads it. */
export interface ProfileRoleWords {
  readonly preset: RolePreset;
  readonly label: string;
}

/** Every word the page draws; `error` is `null` while that control's last save held. */
export interface ProfilePreferencesWords {
  readonly title: string;
  readonly account: string;
  /** The name row's act: opens the name and photo editor. */
  readonly editName: string;
  readonly languageAndUnits: string;
  readonly roles: { readonly title: string; readonly badges: readonly ProfileRoleWords[] };
  readonly language: {
    readonly label: string;
    readonly options: readonly {
      readonly value: UiLanguage;
      readonly label: string;
      readonly lang: string;
    }[];
    readonly source: string;
    readonly error: string | null;
  };
  readonly units: {
    readonly label: string;
    readonly metric: string;
    readonly imperial: string;
    readonly source: string;
    readonly error: string | null;
  };
  readonly push: {
    readonly title: string;
    readonly about: { readonly label: string; readonly line: string };
    readonly whyBilling: { readonly label: string; readonly line: string };
    readonly groups: Readonly<Record<NotificationTypeGroup, string>>;
    /** Under a switch whose last write was refused (D219). */
    readonly notSaved: string;
  };
  /** The push read's frames: its loading bars' name, and its error banner. */
  readonly loading: string;
  readonly loadFailed: { readonly title: string; readonly body: string; readonly retry: string };
}

export function profilePreferencesWords(
  translate: Translator['t'],
  view: ProfilePreferencesView,
  facts: ProfilePreferencesWordFacts,
): ProfilePreferencesWords {
  const own = translate(PROFILE_PREFERENCES.yourChoice);
  const sourceOf = (source: PreferenceSource, inherited: string) =>
    source === 'own' ? own : inherited;
  const notSaved = translate(PROFILE_PREFERENCES.notSaved);
  return {
    title: settingsRowName(translate, 'profile'),
    account: translate(PROFILE_PREFERENCES.account),
    editName: translate(PROFILE_PREFERENCES.editName),
    languageAndUnits: translate(PROFILE_PREFERENCES.languageAndUnits),
    roles: {
      title: translate(
        view.roles.length > 1 ? PROFILE_PREFERENCES.yourRoles : PROFILE_PREFERENCES.yourRole,
      ),
      badges: view.roles.map((preset) => ({ preset, label: presetName(translate, preset) })),
    },
    language: {
      label: translate(PROFILE_PREFERENCES.language),
      options: languageOptions().filter((option) => view.language.options.includes(option.value)),
      source: sourceOf(view.language.source, translate(PROFILE_PREFERENCES.deviceLanguage)),
      error: facts.refused.includes('language') ? notSaved : null,
    },
    units: {
      label: translate(PROFILE_PREFERENCES.measurements),
      metric: translate(PROFILE_PREFERENCES.metres),
      imperial: translate(PROFILE_PREFERENCES.feet),
      source: sourceOf(
        view.units.source,
        translate(PROFILE_PREFERENCES.marketDefault, {
          market: packLabel(facts.pack.name, facts.reader),
        }),
      ),
      error: facts.refused.includes('units') ? notSaved : null,
    },
    push: {
      title: translate(PROFILE_PREFERENCES.push),
      about: {
        label: translate(PROFILE_PREFERENCES.aboutPush),
        line: translate(PROFILE_PREFERENCES.aboutPushLine),
      },
      whyBilling: {
        label: translate(PROFILE_PREFERENCES.whyBilling),
        line: translate(PROFILE_PREFERENCES.whyBillingLine),
      },
      groups: {
        sales: translate(TYPE_GROUP_NAME.sales),
        delivery: translate(TYPE_GROUP_NAME.delivery),
        payments: translate(TYPE_GROUP_NAME.payments),
        team: translate(TYPE_GROUP_NAME.team),
        billing: translate(TYPE_GROUP_NAME.billing),
      },
      notSaved,
    },
    loading: translate(PROFILE_PREFERENCES.loading),
    loadFailed: {
      title: translate(PROFILE_PREFERENCES.loadFailed),
      body: translate(PROFILE_PREFERENCES.nothingChanged),
      retry: translate(SIGN_IN.tryAgain),
    },
  };
}
