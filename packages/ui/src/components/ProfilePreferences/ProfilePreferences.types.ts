import type { TranslatedText } from '@heliogrid/contracts';
import type {
  MeasurementSystem,
  NotificationTypeGroup,
  ProfilePreferencesView,
  PushSwitch,
  Read,
  RolePreset,
  UiLanguage,
} from '@heliogrid/domain';

/** Every word the page draws, already translated: `@heliogrid/i18n`'s `profilePreferencesWords`. */
export interface ProfilePreferencesWords {
  /** The page's title — the web draws it as the page's heading; the phone's bar holds it. */
  readonly title: TranslatedText;
  readonly account: TranslatedText;
  /** The name row's act. */
  readonly editName: TranslatedText;
  readonly languageAndUnits: TranslatedText;
  readonly roles: {
    readonly title: TranslatedText;
    readonly badges: readonly { readonly preset: RolePreset; readonly label: TranslatedText }[];
  };
  readonly language: {
    readonly label: TranslatedText;
    readonly options: readonly {
      readonly value: UiLanguage;
      readonly label: TranslatedText;
      // biome-ignore lint/plugin/copy-prop-type: a BCP 47 language tag
      readonly lang: string;
    }[];
    readonly source: TranslatedText;
    readonly error: TranslatedText | null;
  };
  readonly units: {
    readonly label: TranslatedText;
    readonly metric: TranslatedText;
    readonly imperial: TranslatedText;
    readonly source: TranslatedText;
    readonly error: TranslatedText | null;
  };
  readonly push: {
    readonly title: TranslatedText;
    readonly about: { readonly label: TranslatedText; readonly line: TranslatedText };
    readonly whyBilling: { readonly label: TranslatedText; readonly line: TranslatedText };
    readonly groups: Readonly<Record<NotificationTypeGroup, TranslatedText>>;
    /** Under a switch whose last write was refused (D219). */
    readonly notSaved: TranslatedText;
  };
  /** The loading bars' name while the push read is out. */
  readonly loading: TranslatedText;
  /** The banner the page draws when the push read failed. */
  readonly loadFailed: {
    readonly title: TranslatedText;
    readonly body: TranslatedText;
    readonly retry: TranslatedText;
  };
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
  /** The person's photo in this company; absent draws their initials. */
  readonly photo?: string;
  /** *Edit name*: opens the name and photo editor. */
  readonly onEditName: () => void;
  /** *Your role*: opens the role card (`SCR-M01-10`'s reopened life). */
  readonly onRole: () => void;
  readonly onLanguage: (next: UiLanguage) => void;
  readonly onUnits: (next: MeasurementSystem) => void;
  /** The push read — its switches (domain's `pushSwitches`); a failed read's banner asks it again. */
  readonly read: Read<readonly PushSwitch[]>;
  /** The groups whose last write was refused. */
  readonly refused: readonly NotificationTypeGroup[];
  /** A group's switch was tapped: its push flips. The page passes no value, since a second tap can
   * land before the switch redraws; the caller flips from what it last asked for. */
  readonly onPush: (group: NotificationTypeGroup) => void;
}
