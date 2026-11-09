import {
  LANGUAGES,
  type TranslatedText,
  UI_LANGUAGES,
  type UI_SOURCE_LOCALE,
  type UiLanguage,
} from '@heliogrid/contracts';
import type { Messages } from '@lingui/core';
import { namedInItself } from './copy/assembled';
import { messages as sourceMessages } from './locales/en/messages';

/**
 * Re-exported so nothing above this file knows there are two implementations. The web half
 * code-splits; the `.native.ts` half Metro substitutes does a lookup. Same signature.
 */
export { loadCatalog } from './catalog-loader';

/** Every language a picker offers, each named in itself and tagged for a screen reader (`F3-03`). */
export function languageOptions(): readonly {
  readonly value: UiLanguage;
  readonly label: TranslatedText;
  readonly lang: string;
}[] {
  return UI_LANGUAGES.map((value) => ({
    value,
    label: namedInItself(LANGUAGES[value].endonym),
    lang: value,
  }));
}

/**
 * The SOURCE catalog, statically imported so a runtime can be built synchronously with real
 * messages in it. Two things need that, and neither is cosmetic:
 *  - `i18n.activate()` with no catalog logs "Messages for locale … not loaded." on every boot;
 *  - a message with no catalog entry falls through Lingui's UNCOMPILED path, which in a
 *    PRODUCTION build (where the dev message compiler is absent) `console.warn`s once per
 *    message rendered.
 * It is the fallback catalog whatever language is active.
 *
 * The path must be a literal — no bundler can follow `./locales/${UI_SOURCE_LOCALE}/…`. The
 * `satisfies` below is what keeps the literal and the contract in step: change the source
 * locale and this stops compiling.
 */
const SOURCE_CATALOG_LOCALE = 'en' satisfies typeof UI_SOURCE_LOCALE;
export const SOURCE_CATALOG: { locale: UiLanguage; messages: Messages } = {
  locale: SOURCE_CATALOG_LOCALE,
  messages: sourceMessages,
};
