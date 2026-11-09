import type { TranslatedText } from '@heliogrid/contracts';
import type { Translator } from '../runtime';

/** What the desktop door's sky panel says about the product, beside every front-door step. */
export const DOOR_STORY = {
  title: /*i18n*/ { id: 'Every rooftop, from the first call to the last payment.' },
  line: /*i18n*/ {
    id: 'Leads, surveys, 3D design, proposals and payments in one calm place, on the phone and at the desk.',
  },
} as const;

export interface DoorStoryWords {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

export function doorStoryWords(translate: Translator['t']): DoorStoryWords {
  return { title: translate(DOOR_STORY.title), line: translate(DOOR_STORY.line) };
}
