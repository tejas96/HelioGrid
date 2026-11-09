import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

/** The session's wait before any screen (`BootSplash`): what a screen reader says while it waits. */
export const BOOT = {
  opening: /*i18n*/ { id: 'Opening HelioGrid' },
} as const;

export function bootLabel(translate: Translator['t']): TranslatedText {
  return translate(BOOT.opening);
}
