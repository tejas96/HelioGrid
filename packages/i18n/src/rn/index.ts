/**
 * @heliogrid/i18n/rn — Hermes Intl polyfills. Its own entry because importing it has GLOBAL
 * SIDE EFFECTS: it installs `Intl.Locale` and `Intl.PluralRules` and their locale data.
 * A web bundle must never reach it (browsers ship Intl; the polyfill would be dead weight
 * and could shadow a better implementation), which a shared root export could not prevent.
 *
 * Import it ONCE, FIRST, before any ICU formatting runs (verify-bareRn.md §3).
 *
 * Each language's plural data is held by `PLURAL_RULE_DATA` below, so a language added to the set
 * without its data fails the typecheck, not the phone. The assertion is the second net: it catches a
 * package whose data module no longer installs anything.
 */
import '@formatjs/intl-locale/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill.js';
import * as en from '@formatjs/intl-pluralrules/locale-data/en.js';
import * as hi from '@formatjs/intl-pluralrules/locale-data/hi.js';
import * as mr from '@formatjs/intl-pluralrules/locale-data/mr.js';
import { UI_LANGUAGES, type UiLanguage } from '@heliogrid/contracts';

/**
 * The plural data each language installs on import. Importing a module runs it; naming it here is
 * what lets the typecheck see a missing one — a bare side-effect import is invisible to it.
 */
export const PLURAL_RULE_DATA = { en, hi, mr } satisfies Record<UiLanguage, object>;

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
