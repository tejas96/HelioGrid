import { UI_SOURCE_LOCALE, type UiLanguage } from '@heliogrid/contracts';
import { type I18n, setupI18n } from '@lingui/core';
import { LANGUAGE_META, loadCatalog, SOURCE_CATALOG } from './languages';

/** What a caller needs to turn a message id into a string. No React, no globals. */
export interface Translator {
  readonly locale: UiLanguage;
  readonly dir: 'ltr' | 'rtl';
  /** `id` IS the English source text — THE CONVENTION (packages/i18n/CLAUDE.md). */
  t(id: string, values?: Record<string, unknown>): string;
}

/**
 * A translator bound to ONE locale, for isolated work: a server render, a background job, a
 * PDF export. Each call builds its own `I18n`, so two concurrent requests in different
 * languages cannot see each other's locale.
 *
 * There is deliberately no module-level instance in this package to reach for instead. The
 * previous shape exported one, activated it at import time, and worked only because nothing
 * had two locales at once yet.
 *
 * Store message IDs plus their data — never a translated business record. A record
 * translated at write time is wrong for every other reader of it.
 */
export async function createTranslator(locale: UiLanguage): Promise<Translator> {
  const i18n = setupI18n();
  i18n.loadAndActivate({ locale, messages: await loadCatalog(locale) });
  return translatorFor(i18n, locale);
}

/** The live, switchable runtime one app mount owns. The React provider wraps this. */
export interface I18nRuntime {
  /** The Lingui instance this mount owns — hand it to `<I18nProvider>`, never share it. */
  readonly i18n: I18n;
  locale: UiLanguage;
  /** Async because a catalog is fetched. Both platforms get the same signature. */
  setLocale(next: UiLanguage): Promise<void>;
  t(id: string, values?: Record<string, unknown>): string;
}

function translatorFor(i18n: I18n, locale: UiLanguage): Translator {
  return {
    locale,
    dir: LANGUAGE_META[locale].dir,
    t: (id, values) => i18n._(id, values),
  };
}

/**
 * Builds one mount's runtime. Call it in a `useState` initialiser — NEVER at module scope.
 * Next evaluates a module once per server process and shares it across every request, so a
 * module-scope instance means one visitor's language (and, once a session exists, one
 * visitor's data) is visible to the next.
 *
 * Construction is SYNCHRONOUS and starts on the source catalog, so the first paint is real
 * English rather than a flash of raw keys or a warning storm. Switching to another language
 * is the async path, because that catalog has to be fetched.
 */
export function createI18nRuntime(initial: UiLanguage = UI_SOURCE_LOCALE): I18nRuntime {
  const i18n = setupI18n();
  i18n.loadAndActivate({
    locale: SOURCE_CATALOG.locale,
    messages: SOURCE_CATALOG.messages,
  });
  let current = SOURCE_CATALOG.locale;
  if (initial !== SOURCE_CATALOG.locale) {
    // Fire-and-forget: the caller gets a usable runtime now and the requested language
    // arrives a tick later. The provider re-renders on Lingui's change event.
    void loadCatalog(initial).then((messages) => {
      i18n.loadAndActivate({ locale: initial, messages });
      current = initial;
    });
  }
  return {
    i18n,
    get locale() {
      return current;
    },
    set locale(next: UiLanguage) {
      current = next;
    },
    async setLocale(next) {
      if (next === current) return;
      i18n.loadAndActivate({ locale: next, messages: await loadCatalog(next) });
      current = next;
    },
    t: (id, values) => i18n._(id, values),
  };
}
