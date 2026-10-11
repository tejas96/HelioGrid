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
import { I18nManager, Platform, Settings } from 'react-native';

export {
  createFormsValidationMessage,
  createI18nRuntime,
} from '@heliogrid/i18n';
export { LanguageFollowsUser, useI18n } from '@heliogrid/i18n/react';

/**
 * The first language the person set on this device, as the device writes it (`hi-IN`, `hi_IN`).
 * iOS keeps the person's list under `AppleLanguages`; its current locale answers the app's own
 * localisation, which is English on every iPhone, so it is never asked. Android's
 * `localeIdentifier` is the app's first locale as Android resolved it — the system's first, while
 * the build filters no locale out. Undefined when the device answers nothing.
 */
export function deviceLanguageTag(): string | undefined {
  if (Platform.OS === 'ios') {
    const listed: unknown = Settings.get('AppleLanguages');
    return Array.isArray(listed) && typeof listed[0] === 'string' ? listed[0] : undefined;
  }
  return I18nManager.getConstants().localeIdentifier ?? undefined;
}
