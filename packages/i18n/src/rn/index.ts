/**
 * @heliogrid/i18n/rn — Hermes Intl polyfills. Its own entry because importing it has GLOBAL
 * SIDE EFFECTS: it installs `Intl.Locale` and `Intl.PluralRules` and their locale data.
 * A web bundle must never reach it (browsers ship Intl; the polyfill would be dead weight
 * and could shadow a better implementation), which a shared root export could not prevent.
 *
 * Import it ONCE, FIRST, before any ICU formatting runs (verify-bareRn.md §3).
 *
 * Adding a language to the contract must add its line below. Nothing checks it at build time:
 * neither a type nor a lint rule can see that a side-effect import for locale `xx` is
 * missing, because nothing references it (`docs/tasks/deferred.md`). The assertion below is
 * what catches it, on the phone, at import.
 */
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/hi';
import '@formatjs/intl-pluralrules/locale-data/mr';
import { UI_LANGUAGES } from '@heliogrid/contracts';

/**
 * Proves the polyfill actually took. A missing line, a wrong path or a package reshuffle leaves
 * `supportedLocalesOf` empty and plurals fall back to English rules silently — a Hindi user
 * reading "1 leads".
 */
export function assertPluralRulesReady(): void {
  const missing = UI_LANGUAGES.filter(
    (locale) => Intl.PluralRules.supportedLocalesOf([locale]).length === 0,
  );
  if (missing.length > 0) {
    throw new Error(
      `@heliogrid/i18n/rn: no plural-rule data for ${missing.join(', ')}. ` +
        'Add the @formatjs/intl-pluralrules/locale-data import for each.',
    );
  }
}

assertPluralRulesReady();
