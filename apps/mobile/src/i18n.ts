// Intl polyfills — REQUIRED on Hermes before any ICU formatting (verify-bareRn.md §3)
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-pluralrules/locale-data/en';
import '@formatjs/intl-pluralrules/locale-data/hi';
import '@formatjs/intl-pluralrules/locale-data/mr';

import { i18n } from '@lingui/core';
import { messages as en } from './locales/en/messages.po';
import { messages as hi } from './locales/hi/messages.po';
import { messages as mr } from './locales/mr/messages.po';

export type Locale = 'en' | 'hi' | 'mr';

/** Per-USER language (D25) — switching re-renders the whole app, no reload. */
export function setupI18n(locale: Locale = 'en') {
  i18n.load({ en, hi, mr });
  i18n.activate(locale);
  return i18n;
}

export { i18n };
