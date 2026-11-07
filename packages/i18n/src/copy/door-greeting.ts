import type { TranslatedText } from '@heliogrid/contracts';
import type { DayPart } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * The front door's greeting over "Sign in", by the part of the day on the device. Before the
 * device's hour is known (the web's server render) the door says the plain welcome.
 */
export const DOOR_GREETING = {
  morning: /*i18n*/ { id: 'Good morning' },
  afternoon: /*i18n*/ { id: 'Good afternoon' },
  evening: /*i18n*/ { id: 'Good evening' },
  late: /*i18n*/ { id: 'Welcome back' },
  unknown: /*i18n*/ { id: 'Welcome' },
} as const;

export function doorGreeting(translate: Translator['t'], part: DayPart | null): TranslatedText {
  return translate(DOOR_GREETING[part ?? 'unknown']);
}
