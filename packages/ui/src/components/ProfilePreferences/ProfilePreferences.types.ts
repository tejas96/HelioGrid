import type {
  MeasurementSystem,
  ProfilePreferencesView,
  RolePreset,
  UiLanguage,
} from '@heliogrid/domain';

/** Every word the page draws, already translated: `@heliogrid/i18n`'s `profilePreferencesWords`. */
export interface ProfilePreferencesWords {
  /** The page's title — the web draws it as the page's heading; the phone's bar holds it. */
  readonly title: string;
  readonly account: string;
  readonly languageAndUnits: string;
  readonly roles: {
    readonly title: string;
    readonly badges: readonly { readonly preset: RolePreset; readonly label: string }[];
  };
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
}

/**
 * Profile & preferences (`SCR-M01-11`): the person's name and roles, then their language and
 * units, each applied as it is touched — no Save (brief decision 2). Below the desktop room the
 * phone's page: an account tile, option cards for the language, each line's source under it; from
 * it one column of `SettingsSection` cards with segmented controls and captions, at most 760 wide.
 */
export interface ProfilePreferencesProps {
  readonly words: ProfilePreferencesWords;
  readonly view: ProfilePreferencesView;
  /** The person's name, as the account card shows it. */
  readonly name: string;
  readonly onLanguage: (next: UiLanguage) => void;
  readonly onUnits: (next: MeasurementSystem) => void;
}
