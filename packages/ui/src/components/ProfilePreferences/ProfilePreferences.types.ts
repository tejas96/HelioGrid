import type {
  MeasurementSystem,
  NotificationTypeGroup,
  ProfilePreferencesView,
  PushSwitch,
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
  readonly push: {
    readonly title: string;
    readonly about: { readonly label: string; readonly line: string };
    readonly whyBilling: { readonly label: string; readonly line: string };
    readonly groups: Readonly<Record<NotificationTypeGroup, string>>;
    /** Under a switch whose last write was refused (D219). */
    readonly notSaved: string;
  };
  /** The loading bars' name while the push read is out. */
  readonly loading: string;
  /** The banner the page draws when the push read failed. */
  readonly loadFailed: { readonly title: string; readonly body: string; readonly retry: string };
}

/**
 * The push section's facts: the read's state, its switches (domain's `pushSwitches`), and the
 * groups whose last write was refused.
 */
export interface ProfilePush {
  readonly surface: 'loading' | 'error' | 'ready';
  readonly switches: readonly PushSwitch[];
  readonly refused: readonly NotificationTypeGroup[];
}

/**
 * Profile & preferences (`SCR-M01-11`): the person's name and roles, then their language and
 * units, then a push switch per group, each applied as it is touched — no Save (brief decision 2).
 * Until the push read answers the page is its loading bars, and its error banner if it fails.
 * Below the desktop room the phone's page: an account tile, option cards for the language, each
 * line's source under it; from it one column of `SettingsSection` cards with segmented controls and
 * captions, at most 760 wide.
 */
export interface ProfilePreferencesProps {
  readonly words: ProfilePreferencesWords;
  readonly view: ProfilePreferencesView;
  /** The person's name, as the account card shows it. */
  readonly name: string;
  readonly onLanguage: (next: UiLanguage) => void;
  readonly onUnits: (next: MeasurementSystem) => void;
  readonly push: ProfilePush;
  /** A group's switch was tapped: its push flips. The page passes no value, since a second tap can
   * land before the switch redraws; the caller flips from what it last asked for. */
  readonly onPush: (group: NotificationTypeGroup) => void;
  /** *Try again* on the error banner. */
  readonly onRetry: () => void;
}
