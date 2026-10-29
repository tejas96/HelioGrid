import type { TranslatedText } from '@heliogrid/contracts';
import type { UiLanguage } from '@heliogrid/domain';
import type { ExplainerProps } from '../Explainer/Explainer.types';

/** One language as its card shows it: its own name under its own tag, and where an unmade choice came from. */
export interface SetupLanguageOption {
  value: UiLanguage;
  title: TranslatedText;
  lang: string;
  current?: boolean;
  currentLabel?: TranslatedText;
}

/** Every word the screen draws; `@heliogrid/i18n`'s `setupLanguageWords` writes them. */
export interface SetupLanguageWords {
  title: TranslatedText;
  /** Where the choice lives afterwards, and that it follows the person — behind the ask. */
  explainer: ExplainerProps;
  /** The option group's visible name. */
  group: TranslatedText;
  options: readonly SetupLanguageOption[];
  /** Why English was chosen, when the device's language is outside the set. */
  notice: TranslatedText | null;
  /** What went wrong and what fixes it, after the step's save failed. */
  failure: { title: TranslatedText; body: TranslatedText } | null;
  primary: TranslatedText;
  /** The way on without the record; drawn only after a failed save. */
  secondary: TranslatedText | null;
}

/**
 * The first setup step (`SCR-M01-03`, `F3-03`): each language under its own name, the one the app
 * is in selected, and one way on. A choice applies at once, so there is no save control; the
 * primary only records the step, and after a failed save it stands beside a way on without it.
 */
export interface SetupLanguageProps {
  words: SetupLanguageWords;
  /** The language the app is in — the selected card. */
  language: UiLanguage;
  onChoose: (language: UiLanguage) => void;
  /** The step's record is in flight. */
  saving: boolean;
  /** Records the step: the primary, whichever word it carries. */
  onContinue: () => void;
  /** Moves on without the record. */
  onContinueAnyway: () => void;
}
