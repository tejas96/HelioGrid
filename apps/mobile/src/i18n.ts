/**
 * The app's language wiring, and the reason it is a file rather than an import in App.tsx:
 * `@heliogrid/i18n/rn` MUST be evaluated before any ICU formatting runs, and a named seam
 * makes that ordering something you can see instead of something you have to remember.
 * It installs the Hermes Intl polyfills and asserts their locale data on import.
 *
 * It exports only what App.tsx composes. A SCREEN imports `@heliogrid/i18n/react` directly
 * for `<Trans>`, `useI18n` and `useTranslate` — re-exporting them here would be a second
 * barrel to keep in step, and the polyfills are already installed by the time a screen renders.
 */
import '@heliogrid/i18n/rn';

export {
  createFormsValidationMessage,
  createI18nRuntime,
} from '@heliogrid/i18n';
export { HelioI18nProvider } from '@heliogrid/i18n/react';
