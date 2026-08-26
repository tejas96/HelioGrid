import type { UI_SOURCE_LOCALE, UiLanguage } from '@heliogrid/contracts';
import type { Messages } from '@lingui/core';
import { messages as sourceMessages } from './locales/en/messages';

/**
 * Re-exported so nothing above this file knows there are two implementations. The web half
 * code-splits; the `.native.ts` half Metro substitutes does a lookup. Same signature.
 */
export { loadCatalog } from './catalog-loader';

/**
 * Presentation facts about a UI language. IDENTITY (which languages exist) is the
 * contract's; these are this package's. Keep them apart: a market pack decides currency
 * grouping, tax scheme and paperwork, and a Marathi-reading user in an Indian tenant still
 * sees INR in lakh/crore grouping. UI language never selects a money format.
 */
export interface LanguageMeta {
  /** BCP-47 tag — what `<html lang>` and every `Intl` constructor receive. */
  tag: string;
  /** The language's own name, for a picker. NEVER translated: you read it in itself. */
  endonym: string;
  /** Writing direction, so the first RTL language is a data edit and not a layout rewrite. */
  dir: 'ltr' | 'rtl';
}

/**
 * `satisfies Record<UiLanguage, …>` is the mechanism, not decoration: add a language to the
 * contract and this object stops compiling until it is registered here.
 */
export const LANGUAGE_META = {
  en: { tag: 'en', endonym: 'English', dir: 'ltr' },
  hi: { tag: 'hi', endonym: 'हिन्दी', dir: 'ltr' },
  mr: { tag: 'mr', endonym: 'मराठी', dir: 'ltr' },
} satisfies Record<UiLanguage, LanguageMeta>;

/**
 * The SOURCE catalog, statically imported so a runtime can be built synchronously with real
 * messages in it. Two things need that, and neither is cosmetic:
 *  - `i18n.activate()` with no catalog logs "Messages for locale … not loaded." on every boot;
 *  - a message with no catalog entry falls through Lingui's UNCOMPILED path, which in a
 *    PRODUCTION build (where the dev message compiler is absent) `console.warn`s once per
 *    message rendered.
 * It is ~14 messages, and it is the fallback catalog regardless of the active language.
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
