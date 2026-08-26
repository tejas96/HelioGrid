/**
 * @heliogrid/i18n/react — the ONE provider and hook surface both platforms use.
 *
 * `@lingui/react` is re-exported from HERE so neither app declares it: one package owns the
 * dependency, and swapping the message library touches this directory and nothing else.
 */
export type { TransProps } from '@lingui/react';
export { Trans, useLingui } from '@lingui/react';
export type { HelioI18nProviderProps, I18nControls } from './provider';
export { HelioI18nProvider, useI18n, useTranslate } from './provider';
