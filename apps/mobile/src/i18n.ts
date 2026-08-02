// Intl polyfills — REQUIRED on Hermes before any ICU formatting (verify-bareRn.md §3)
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/hi';
import '@formatjs/intl-pluralrules/locale-data/mr';

/** ONE shared catalog (packages/i18n) — compiled messages, no runtime parser. */
export { formsValidationMessage, i18n, LOCALES, type Locale, setupI18n } from '@heliogrid/i18n';
