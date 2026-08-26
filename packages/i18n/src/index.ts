/**
 * @heliogrid/i18n — ONE Lingui catalog (EN/HI/MR) for Next.js AND bare React Native.
 *
 * This entry is REACT-FREE. Four entries, and the split is the point:
 *   `.`      identity-adjacent metadata, catalog loading, and `createTranslator` for
 *            isolated server/background/export work.
 *   `./react` the provider, the hooks, and the Lingui component API.
 *   `./rn`    Hermes Intl polyfills — global side effects that must never enter a web bundle.
 *
 * The language SET is not re-exported: it lives in `@heliogrid/contracts`
 * (`UI_LANGUAGES` / `UiLanguage`), and restating it here would be the second list this
 * package exists to prevent.
 */
export type { ApiErrorLike } from './copy/api-error';
export { apiErrorMessageId, apiErrorRef } from './copy/api-error';
export type { ValidationIssueLike } from './copy/validation';
export { createFormsValidationMessage } from './copy/validation';
export type { LanguageMeta } from './languages';
export { LANGUAGE_META, loadCatalog } from './languages';
export type { I18nRuntime, Translator } from './runtime';
export { createI18nRuntime, createTranslator } from './runtime';
