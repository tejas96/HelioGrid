import { type UiLanguage, uiLanguageSchema } from '@heliogrid/contracts';
import { i18n } from '@lingui/core';
import { messages as en } from './locales/en/messages';
import { messages as hi } from './locales/hi/messages';
import { messages as mr } from './locales/mr/messages';

/**
 * One catalog, two consumers (docs/10 §7). Catalogs are COMPILED at build time (no
 * runtime parser); missing translations fall back to English — never a bare key.
 * Per-USER language (D25): switching re-renders the whole app, no reload.
 * The locale set derives from the contracts enum — one source, never restated.
 */
export const LOCALES = uiLanguageSchema.options;
export type Locale = UiLanguage;

export const catalogs = { en, hi, mr } as const;

export function setupI18n(locale: Locale = 'en') {
  i18n.load(catalogs);
  i18n.activate(locale);
  return i18n;
}

export { i18n };
