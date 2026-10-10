import { UI_LANGUAGES, type UiLanguage } from '@heliogrid/contracts';
import { SIGN_IN } from '../copy/sign-in';
import { LANGUAGE_META } from '../languages';
import { useI18n } from './provider';

/** What a language control draws and raises: its name, the mount's language, each language's own name, and the choice. */
export interface LanguageChoice {
  label: string;
  current: UiLanguage;
  /** Never translated: you read a language's name in itself. */
  names: Readonly<Record<UiLanguage, string>>;
  onChoose: (language: UiLanguage) => void;
}

const NAMES = Object.fromEntries(
  UI_LANGUAGES.map((code) => [code, LANGUAGE_META[code].endonym]),
) as Record<UiLanguage, string>;

/**
 * The language control's facts for the mount: a signed-out person switches language before anyone
 * signs in (`SCR-M01-01` decision 5), and the choice moves the mount at once (`F3-04`).
 */
export function useLanguageChoice(): LanguageChoice {
  const { locale, setLocale, t } = useI18n();
  return {
    label: t(SIGN_IN.changeLanguage),
    current: locale,
    names: NAMES,
    onChoose: (language) => void setLocale(language),
  };
}
