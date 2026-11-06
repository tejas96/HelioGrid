import { APPEARANCES } from '@heliogrid/domain';
import type { AppearanceWords } from './AppearanceSwitch.types';

/** The three choices, in the order the switch draws them. */
export function appearanceOptions(words: AppearanceWords) {
  return APPEARANCES.map((value) => ({ value, label: words.options[value] }));
}
