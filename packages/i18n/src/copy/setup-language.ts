/**
 * The words of the first setup step (`SCR-M01-03`, `F3-03`): the question, each language under its
 * own name, where an unmade choice came from, and what a failed save says — authored once for both
 * platforms (Law 11). The component picks no word by state; it draws what this returns.
 */
import { UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import type { ExplainerPagerWords } from '@heliogrid/domain';
import { languageOptions } from '../languages';
import type { Translator } from '../runtime';
import { type ExplainerWords, explainerPagerWords } from './explainer';
import { SIGN_IN } from './sign-in';

export const SETUP_LANGUAGE = {
  title: /*i18n*/ { id: 'Choose your language' },
  askLabel: /*i18n*/ { id: 'About your language' },
  askTitle: /*i18n*/ { id: 'Your language' },
  askFollowsYou: /*i18n*/ {
    id: 'Your language belongs to you, not to this device. It follows you wherever you sign in.',
  },
  askChangeIt: /*i18n*/ { id: 'Change it any time in Profile & preferences.' },
  group: /*i18n*/ { id: 'Language' },
  devicePill: /*i18n*/ { id: 'Your device’s language' },
  chosenPill: /*i18n*/ { id: 'Chosen for you' },
  notInSet: /*i18n*/ {
    id: 'Your device’s language isn’t in HelioGrid yet, so the app started in English.',
  },
  continue: /*i18n*/ { id: 'Continue' },
  notSavedTitle: /*i18n*/ { id: 'Your language was not saved' },
  notSavedBody: /*i18n*/ {
    id: 'Try again, or continue and be asked again at your next sign-in.',
  },
  continueAnyway: /*i18n*/ { id: 'Continue anyway' },
};

/** One language as its card shows it: its own name, never translated, under its own tag. */
export interface SetupLanguageOption {
  readonly value: UiLanguage;
  readonly title: string;
  readonly lang: string;
  /** Set on the one card whose language nobody chose — the device's, or English in its place. */
  readonly current?: true;
  /** Where that card's language came from. */
  readonly currentLabel?: string;
}

export interface SetupLanguageWords {
  readonly title: string;
  /** Where the choice lives afterwards, and that it follows the person — behind the ask. */
  readonly explainer: ExplainerWords & ExplainerPagerWords;
  readonly group: string;
  readonly options: readonly SetupLanguageOption[];
  /** Why English was chosen, when the device's language is outside the set. */
  readonly notice: string | null;
  /** What went wrong and what fixes it, after the step's save failed. */
  readonly failure: { readonly title: string; readonly body: string } | null;
  /** Records the step: `Continue`, and `Try again` after a failed save. */
  readonly primary: string;
  /** Moves on without the record, after a failed save alone. */
  readonly secondary: string | null;
}

/**
 * `device` is the device's own language where the set holds it, else null; `failed` is the step's
 * save having failed. The pill follows the device and never the selection (`SCR-M01-03` decision
 * 3): it says where the first language came from, which choosing another does not change.
 */
export function setupLanguageWords(
  translate: Translator['t'],
  facts: { readonly device: UiLanguage | null; readonly failed: boolean },
): SetupLanguageWords {
  const unchosen = facts.device ?? UI_SOURCE_LOCALE;
  const origin = translate(
    facts.device === null ? SETUP_LANGUAGE.chosenPill : SETUP_LANGUAGE.devicePill,
  );
  return {
    title: translate(SETUP_LANGUAGE.title),
    explainer: {
      label: translate(SETUP_LANGUAGE.askLabel),
      title: translate(SETUP_LANGUAGE.askTitle),
      pages: [translate(SETUP_LANGUAGE.askFollowsYou), translate(SETUP_LANGUAGE.askChangeIt)],
      ...explainerPagerWords(translate),
    },
    group: translate(SETUP_LANGUAGE.group),
    options: languageOptions().map(({ value, label, lang }) => ({
      value,
      title: label,
      lang,
      ...(value === unchosen ? { current: true as const, currentLabel: origin } : {}),
    })),
    notice: facts.device === null ? translate(SETUP_LANGUAGE.notInSet) : null,
    failure: facts.failed
      ? {
          title: translate(SETUP_LANGUAGE.notSavedTitle),
          body: translate(SETUP_LANGUAGE.notSavedBody),
        }
      : null,
    primary: translate(facts.failed ? SIGN_IN.tryAgain : SETUP_LANGUAGE.continue),
    secondary: facts.failed ? translate(SETUP_LANGUAGE.continueAnyway) : null,
  };
}
