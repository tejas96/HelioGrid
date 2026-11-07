import type { TranslatedText } from '@heliogrid/contracts';
import type { Appearance } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/** The words of Profile & preferences' appearance switch: Device, Light or Dark. */
export const APPEARANCE = {
  title: /*i18n*/ { id: 'Appearance' },
  label: /*i18n*/ { id: 'Theme' },
  caption: /*i18n*/ { id: 'Kept on this device' },
  device: /*i18n*/ { id: 'Device' },
  light: /*i18n*/ { id: 'Light' },
  dark: /*i18n*/ { id: 'Dark' },
} as const;

export interface AppearanceWordSet {
  readonly title: TranslatedText;
  readonly label: TranslatedText;
  readonly caption: TranslatedText;
  readonly options: Readonly<Record<Appearance, TranslatedText>>;
}

export function appearanceWords(t: Translator['t']): AppearanceWordSet {
  return {
    title: t(APPEARANCE.title),
    label: t(APPEARANCE.label),
    caption: t(APPEARANCE.caption),
    options: { device: t(APPEARANCE.device), light: t(APPEARANCE.light), dark: t(APPEARANCE.dark) },
  };
}
